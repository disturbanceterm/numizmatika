/**
 * Servis kataloga: sinhronizacija izdavača, učitavanje /types po izdavaču u SQLite,
 * lijeno popunjavanje detalja (valuta) i sastavljanje albuma / statistike popunjenosti.
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 * 2026-09-21  loadCatalog sa pravim ključem briše probne tipove (bez tvojih komada) za tog izdavača.
 * 2026-09-21  AlbumTile nosi pune slike lica/naličja i opise iz rawDetail (za veliki prikaz).
 * 2026-09-21  getAlbum bez `include: items` – Prisma je pravila `IN (...)` sa >999 parametara (P2029 na SQLite).
 */
import "server-only";

import { prisma } from "@/lib/db";
import {
  fetchIssuers,
  fetchTypeDetail,
  fetchTypesPage,
  getDetailBudget,
  isSampleMode,
  NumistaError,
} from "@/lib/numista/client";
import { SAMPLE_ID_MIN } from "@/lib/numista/sample-catalog";
import { categoryFromObjectType, type NumistaTypeDetail, type NumistaTypeSummary } from "@/lib/numista/types";

const PAGE_SIZE = 50;

/* ------------------------------------------------------------------ */
/* Izdavači                                                             */
/* ------------------------------------------------------------------ */

export async function syncIssuers(): Promise<{ count: number }> {
  const res = await fetchIssuers();
  // REASON: ~4200 redova; pojedinačni upsert-i u jednoj transakciji su dovoljno brzi za SQLite
  // i ne zahtijevaju posebnu "bulk" sintaksu.
  await prisma.$transaction(
    res.issuers.map((i) =>
      prisma.issuer.upsert({
        where: { code: i.code },
        create: {
          code: i.code,
          name: i.name,
          flag: i.flag ?? null,
          wikidataId: i.wikidata_id ?? null,
          parentCode: i.parent?.code ?? null,
          parentName: i.parent?.name ?? null,
          level: i.level ?? 1,
        },
        update: {
          name: i.name,
          flag: i.flag ?? null,
          wikidataId: i.wikidata_id ?? null,
          parentCode: i.parent?.code ?? null,
          parentName: i.parent?.name ?? null,
          level: i.level ?? 1,
        },
      }),
    ),
  );
  await prisma.setting.upsert({
    where: { key: "issuers.syncedAt" },
    create: { key: "issuers.syncedAt", value: new Date().toISOString() },
    update: { value: new Date().toISOString() },
  });
  return { count: res.issuers.length };
}

export async function getIssuersSyncedAt(): Promise<Date | null> {
  const s = await prisma.setting.findUnique({ where: { key: "issuers.syncedAt" } });
  return s ? new Date(s.value) : null;
}

export async function searchIssuers(q: string, limit = 25) {
  const term = q.trim();
  if (!term) return [];
  return prisma.issuer.findMany({
    where: {
      OR: [{ name: { contains: term } }, { code: { contains: term } }, { parentName: { contains: term } }],
    },
    orderBy: [{ level: "asc" }, { name: "asc" }],
    take: limit,
  });
}

export function getIssuer(code: string) {
  return prisma.issuer.findUnique({ where: { code } });
}

/* ------------------------------------------------------------------ */
/* Učitavanje kataloga (/types)                                         */
/* ------------------------------------------------------------------ */

function summaryToRow(issuerCode: string, t: NumistaTypeSummary) {
  return {
    issuerCode,
    category: categoryFromObjectType(t.object_type?.name, t.category),
    objectTypeName: t.object_type?.name ?? null,
    title: t.title,
    minYear: t.min_year ?? null,
    maxYear: t.max_year ?? null,
    obverseThumb: t.obverse_thumbnail ?? null,
    reverseThumb: t.reverse_thumbnail ?? null,
    rawList: JSON.stringify(t),
  };
}

export interface LoadCatalogResult {
  issuerCode: string;
  total: number;
  loaded: number;
  pages: number;
  /** Probni tipovi uklonjeni pri prvom pravom učitavanju. */
  removedSample: number;
}

/**
 * Dovlači sve strane /types?issuer=... (50 po strani = 1 poziv) i upisuje ih u CatalogType.
 * Postojeći redovi se osvježavaju bez gubitka detalja (rawDetail, valuta).
 */
export async function loadCatalog(issuerCode: string): Promise<LoadCatalogResult> {
  const issuer = await prisma.issuer.findUnique({ where: { code: issuerCode } });
  if (!issuer) throw new Error(`Nepoznat izdavač: ${issuerCode}`);

  let page = 1;
  let loaded = 0;
  let total = 0;
  for (;;) {
    const res = await fetchTypesPage(issuerCode, page, PAGE_SIZE);
    total = Number(res.count) || 0;
    if (res.types.length === 0) break;

    await prisma.$transaction(
      res.types.map((t) => {
        const row = summaryToRow(issuerCode, t);
        return prisma.catalogType.upsert({
          where: { id: t.id },
          create: { id: t.id, ...row },
          update: row,
        });
      }),
    );
    loaded += res.types.length;
    if (loaded >= total || res.types.length < PAGE_SIZE) break;
    page++;
  }

  let removedSample = 0;
  if (!isSampleMode()) {
    // REASON: Ako je album ranije punjen iz probnog kataloga, njegovi izmišljeni tipovi ne smiju
    // ostati pomiješani sa pravima. Tipove na koje si već vezao svoje komade čuvamo.
    const res = await prisma.catalogType.deleteMany({
      where: { issuerCode, id: { gte: SAMPLE_ID_MIN }, items: { none: {} } },
    });
    removedSample = res.count;
  }

  await prisma.issuer.update({
    where: { code: issuerCode },
    data: { catalogSyncedAt: new Date(), catalogTotal: total },
  });

  return { issuerCode, total, loaded, pages: page, removedSample };
}

/* ------------------------------------------------------------------ */
/* Lijeno popunjavanje detalja (/types/{id})                           */
/* ------------------------------------------------------------------ */

function detailToRow(d: NumistaTypeDetail) {
  return {
    currencyName: d.value?.currency?.full_name ?? null,
    currencyId: d.value?.currency?.id ?? null,
    valueText: d.value?.text ?? null,
    numericValue: d.value?.numeric_value ?? null,
    obverseThumb: d.obverse?.thumbnail ?? undefined,
    reverseThumb: d.reverse?.thumbnail ?? undefined,
    rawDetail: JSON.stringify(d),
    detailFetchedAt: new Date(),
  };
}

export interface FillDetailsResult {
  fetched: number;
  remaining: number;
  budget: number;
  stoppedReason?: "budget" | "quota" | "error";
  error?: string;
}

/**
 * Popunjava valutu/nominalu za tipove izdavača koji je još nemaju, do `budget` poziva.
 * Sve što stigne ostaje trajno u bazi, pa se kvota troši samo jednom po komadu.
 */
export async function fillDetails(issuerCode: string, budget = getDetailBudget()): Promise<FillDetailsResult> {
  const pending = await prisma.catalogType.findMany({
    where: { issuerCode, detailFetchedAt: null },
    select: { id: true },
    orderBy: [{ minYear: "asc" }, { id: "asc" }],
  });

  let fetched = 0;
  for (const { id } of pending) {
    if (fetched >= budget) {
      return { fetched, remaining: pending.length - fetched, budget, stoppedReason: "budget" };
    }
    try {
      const detail = await fetchTypeDetail(id);
      await prisma.catalogType.update({ where: { id }, data: detailToRow(detail) });
      fetched++;
    } catch (e) {
      if (e instanceof NumistaError && e.code === "not_found") {
        // REASON: Tip obrisan/spojen na Numisti – označi kao obrađen da ne trošimo kvotu iznova.
        await prisma.catalogType.update({ where: { id }, data: { detailFetchedAt: new Date() } });
        continue;
      }
      const reason = e instanceof NumistaError && (e.code === "quota_exhausted" || e.code === "rate_limited") ? "quota" : "error";
      return {
        fetched,
        remaining: pending.length - fetched,
        budget,
        stoppedReason: reason,
        error: (e as Error).message,
      };
    }
  }
  return { fetched, remaining: 0, budget };
}

/* ------------------------------------------------------------------ */
/* Album                                                                */
/* ------------------------------------------------------------------ */

export interface AlbumTile {
  id: number;
  title: string;
  category: string;
  objectTypeName: string | null;
  minYear: number | null;
  maxYear: number | null;
  obverseThumb: string | null;
  reverseThumb: string | null;
  currencyName: string | null;
  valueText: string | null;
  numericValue: number | null;
  detailFetched: boolean;
  /** Puna slika lica/naličja sa Numiste (iz GET /types/{id}); null dok detalji nisu dovučeni. */
  obversePicture: string | null;
  reversePicture: string | null;
  obverseDescription: string | null;
  reverseDescription: string | null;
  numistaUrl: string | null;
  items: {
    id: number;
    year: number | null;
    grade: string | null;
    quantity: number;
    imagePath: string | null;
    note: string | null;
    price: number | null;
  }[];
}

export interface AlbumGroup {
  key: string;
  label: string;
  /** Godine iz imena valute ("Dinar (1944-1965)") ili iz raspona tipova. */
  yearFrom: number | null;
  yearTo: number | null;
  known: boolean;
  tiles: AlbumTile[];
  owned: number;
}

export interface Album {
  issuer: { code: string; name: string; flag: string | null; catalogSyncedAt: string | null; catalogTotal: number | null };
  groups: AlbumGroup[];
  total: number;
  owned: number;
  withoutDetail: number;
  counts: { banknote: number; coin: number; exonumia: number };
}

interface DetailPictures {
  obversePicture: string | null;
  reversePicture: string | null;
  obverseDescription: string | null;
  reverseDescription: string | null;
  numistaUrl: string | null;
}

const NO_PICTURES: DetailPictures = {
  obversePicture: null,
  reversePicture: null,
  obverseDescription: null,
  reverseDescription: null,
  numistaUrl: null,
};

// REASON: Pune slike čitamo iz sačuvanog JSON-a detalja umjesto novih kolona – nema migracije,
// a parsiranje nekoliko stotina malih JSON-ova po albumu je zanemarljivo.
function picturesFromDetail(raw: string | null): DetailPictures {
  if (!raw) return NO_PICTURES;
  try {
    const d = JSON.parse(raw) as NumistaTypeDetail;
    return {
      obversePicture: d.obverse?.picture ?? d.obverse?.thumbnail ?? null,
      reversePicture: d.reverse?.picture ?? d.reverse?.thumbnail ?? null,
      obverseDescription: d.obverse?.description ?? null,
      reverseDescription: d.reverse?.description ?? null,
      numistaUrl: d.url ?? null,
    };
  } catch {
    return NO_PICTURES;
  }
}

function parseYearsFromCurrency(name: string): { from: number | null; to: number | null } {
  const m = name.match(/\((\d{3,4})\s*-\s*(\d{3,4}|date)\)/i);
  if (!m) return { from: null, to: null };
  return { from: Number(m[1]), to: m[2].toLowerCase() === "date" ? null : Number(m[2]) };
}

export async function getAlbum(issuerCode: string): Promise<Album | null> {
  const issuer = await prisma.issuer.findUnique({ where: { code: issuerCode } });
  if (!issuer) return null;

  // REASON: `include: { items }` bi generisao `WHERE typeId IN (<svi id-jevi>)`; za ~2000 tipova to
  // prelazi SQLite limit od 999 parametara (P2029). Zato komade vučemo jednim JOIN upitom i spajamo u JS-u.
  const [types, allItems] = await Promise.all([
    prisma.catalogType.findMany({
      where: { issuerCode },
      orderBy: [{ minYear: "asc" }, { numericValue: "asc" }, { id: "asc" }],
    }),
    prisma.collectionItem.findMany({
      where: { type: { issuerCode } },
      orderBy: { id: "asc" },
    }),
  ]);
  const itemsByType = new Map<number, typeof allItems>();
  for (const it of allItems) {
    const list = itemsByType.get(it.typeId);
    if (list) list.push(it);
    else itemsByType.set(it.typeId, [it]);
  }
  const rows = types.map((t) => ({ ...t, items: itemsByType.get(t.id) ?? [] }));

  const groups = new Map<string, AlbumGroup>();
  const counts = { banknote: 0, coin: 0, exonumia: 0 };
  let owned = 0;
  let withoutDetail = 0;

  for (const r of rows) {
    counts[r.category as keyof typeof counts] = (counts[r.category as keyof typeof counts] ?? 0) + 1;
    if (!r.detailFetchedAt) withoutDetail++;
    if (r.items.length > 0) owned++;

    let key: string;
    let label: string;
    let yearFrom: number | null;
    let yearTo: number | null;
    let known = true;
    if (r.currencyName) {
      key = `cur:${r.currencyId ?? r.currencyName}`;
      label = r.currencyName;
      ({ from: yearFrom, to: yearTo } = parseYearsFromCurrency(r.currencyName));
    } else {
      // REASON: Dok detalji nisu dovučeni, valutu ne znamo – grupišemo po deceniji prve godine.
      known = false;
      const decade = r.minYear != null ? Math.floor(r.minYear / 10) * 10 : null;
      key = decade != null ? `dec:${decade}` : "dec:unknown";
      label = decade != null ? `Period ${decade}–${decade + 9}` : "Nepoznat period";
      yearFrom = decade;
      yearTo = decade != null ? decade + 9 : null;
    }

    let g = groups.get(key);
    if (!g) {
      g = { key, label, yearFrom, yearTo, known, tiles: [], owned: 0 };
      groups.set(key, g);
    }
    if (r.items.length > 0) g.owned++;
    g.tiles.push({
      id: r.id,
      title: r.title,
      category: r.category,
      objectTypeName: r.objectTypeName,
      minYear: r.minYear,
      maxYear: r.maxYear,
      obverseThumb: r.obverseThumb,
      reverseThumb: r.reverseThumb,
      currencyName: r.currencyName,
      valueText: r.valueText,
      numericValue: r.numericValue,
      detailFetched: !!r.detailFetchedAt,
      ...picturesFromDetail(r.rawDetail),
      items: r.items.map((i) => ({
        id: i.id,
        year: i.year,
        grade: i.grade,
        quantity: i.quantity,
        imagePath: i.imagePath,
        note: i.note,
        price: i.price,
      })),
    });
  }

  const sorted = [...groups.values()].sort((a, b) => {
    const ay = a.yearFrom ?? Math.min(...a.tiles.map((t) => t.minYear ?? 9999));
    const by = b.yearFrom ?? Math.min(...b.tiles.map((t) => t.minYear ?? 9999));
    return ay - by || a.label.localeCompare(b.label);
  });

  return {
    issuer: {
      code: issuer.code,
      name: issuer.name,
      flag: issuer.flag,
      catalogSyncedAt: issuer.catalogSyncedAt?.toISOString() ?? null,
      catalogTotal: issuer.catalogTotal,
    },
    groups: sorted,
    total: rows.length,
    owned,
    withoutDetail,
    counts,
  };
}

/* ------------------------------------------------------------------ */
/* Statistika popunjenosti po izdavaču (za mapu)                       */
/* ------------------------------------------------------------------ */

export interface IssuerStats {
  code: string;
  name: string;
  total: number;
  owned: number;
  loaded: boolean;
}

export async function getIssuerStats(codes: string[]): Promise<Map<string, IssuerStats>> {
  const result = new Map<string, IssuerStats>();
  if (codes.length === 0) return result;

  const issuers = await prisma.issuer.findMany({ where: { code: { in: codes } } });
  const totals = await prisma.catalogType.groupBy({
    by: ["issuerCode"],
    where: { issuerCode: { in: codes } },
    _count: { _all: true },
  });
  const ownedRows = await prisma.catalogType.findMany({
    where: { issuerCode: { in: codes }, items: { some: {} } },
    select: { issuerCode: true },
  });

  const totalBy = new Map(totals.map((t) => [t.issuerCode, t._count._all]));
  const ownedBy = new Map<string, number>();
  for (const r of ownedRows) ownedBy.set(r.issuerCode, (ownedBy.get(r.issuerCode) ?? 0) + 1);

  for (const i of issuers) {
    result.set(i.code, {
      code: i.code,
      name: i.name,
      total: totalBy.get(i.code) ?? 0,
      owned: ownedBy.get(i.code) ?? 0,
      loaded: !!i.catalogSyncedAt,
    });
  }
  return result;
}
