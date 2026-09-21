/**
 * Veze region (ime sa mape) -> Numista izdavač: sijanje iz data/region-links.json,
 * pretraga po godini, lista svih regiona sa mapa.
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 */
import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

import { prisma } from "@/lib/db";
import { MAP_YEARS, type MapYear, type RegionProperties } from "@/lib/map-years";

interface SeedLink {
  region: string;
  issuer: string;
  issuerName: string;
  yearFrom?: number;
  yearTo?: number;
  verified?: boolean;
  note?: string;
}

interface SeedFile {
  links: SeedLink[];
}

const SEED_PATH = path.join(process.cwd(), "data", "region-links.json");
const SEED_SETTING_KEY = "regionLinks.seededAt";

let seedPromise: Promise<void> | undefined;

/**
 * Idempotentno sijanje: radi se jednom po procesu i preskače ako je već zabilježeno u bazi.
 * Korisnikove veze (source = "user") se nikad ne diraju.
 */
export function ensureRegionLinksSeeded(): Promise<void> {
  // REASON: Više paralelnih zahtjeva (mapa + panel) ne smije pokrenuti dva sijanja odjednom.
  seedPromise ??= seedRegionLinks().catch((e) => {
    seedPromise = undefined;
    throw e;
  });
  return seedPromise;
}

async function seedRegionLinks(): Promise<void> {
  const already = await prisma.setting.findUnique({ where: { key: SEED_SETTING_KEY } });
  if (already) return;

  const raw = await fs.readFile(SEED_PATH, "utf8");
  const seed = JSON.parse(raw) as SeedFile;

  for (const link of seed.links) {
    await prisma.issuer.upsert({
      where: { code: link.issuer },
      // REASON: Placeholder bez `level` – pravi podaci stižu pri sinhronizaciji /issuers.
      create: { code: link.issuer, name: link.issuerName },
      update: {},
    });
    const existing = await prisma.regionLink.findFirst({
      where: {
        regionName: link.region,
        issuerCode: link.issuer,
        yearFrom: link.yearFrom ?? null,
        yearTo: link.yearTo ?? null,
      },
    });
    if (!existing) {
      await prisma.regionLink.create({
        data: {
          regionName: link.region,
          issuerCode: link.issuer,
          yearFrom: link.yearFrom ?? null,
          yearTo: link.yearTo ?? null,
          source: link.verified === false ? "seed-unverified" : "seed",
        },
      });
    }
  }

  await prisma.setting.upsert({
    where: { key: SEED_SETTING_KEY },
    create: { key: SEED_SETTING_KEY, value: new Date().toISOString() },
    update: { value: new Date().toISOString() },
  });
}

export async function getLinksForRegion(regionName: string, year?: number) {
  await ensureRegionLinksSeeded();
  const links = await prisma.regionLink.findMany({
    where: { regionName },
    include: { issuer: true },
    orderBy: { id: "asc" },
  });
  if (year == null) return links;
  return links.filter(
    (l) => (l.yearFrom == null || l.yearFrom <= year) && (l.yearTo == null || l.yearTo >= year),
  );
}

/** Sve veze, grupisano po regionu, za /podesavanja i za bojenje mape. */
export async function getAllLinks() {
  await ensureRegionLinksSeeded();
  return prisma.regionLink.findMany({ include: { issuer: true }, orderBy: [{ regionName: "asc" }, { id: "asc" }] });
}

export async function createLink(input: {
  regionName: string;
  issuerCode: string;
  yearFrom?: number | null;
  yearTo?: number | null;
}) {
  await ensureRegionLinksSeeded();
  return prisma.regionLink.create({
    data: {
      regionName: input.regionName.trim(),
      issuerCode: input.issuerCode,
      yearFrom: input.yearFrom ?? null,
      yearTo: input.yearTo ?? null,
      source: "user",
    },
    include: { issuer: true },
  });
}

export async function deleteLink(id: number) {
  return prisma.regionLink.delete({ where: { id } });
}

/* ------------------------------------------------------------------ */
/* Regioni sa mapa                                                      */
/* ------------------------------------------------------------------ */

export interface MapRegion {
  name: string;
  years: MapYear[];
}

let regionsCache: MapRegion[] | undefined;

/** Čita sve GeoJSON fajlove jednom i vraća jedinstvena imena regiona sa godinama u kojima se pojavljuju. */
export async function getAllMapRegions(): Promise<MapRegion[]> {
  if (regionsCache) return regionsCache;
  const byName = new Map<string, Set<MapYear>>();
  for (const year of MAP_YEARS) {
    const file = path.join(process.cwd(), "public", "maps", `world_${year}.geojson`);
    const raw = await fs.readFile(file, "utf8");
    const geo = JSON.parse(raw) as { features: { properties: RegionProperties }[] };
    for (const f of geo.features) {
      const name = f.properties?.NAME?.trim();
      if (!name) continue;
      if (!byName.has(name)) byName.set(name, new Set());
      byName.get(name)!.add(year);
    }
  }
  regionsCache = [...byName.entries()]
    .map(([name, years]) => ({ name, years: [...years].sort((a, b) => a - b) as MapYear[] }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return regionsCache;
}

export async function getUnlinkedRegions(): Promise<MapRegion[]> {
  const [regions, links] = await Promise.all([getAllMapRegions(), getAllLinks()]);
  const linked = new Set(links.map((l) => l.regionName));
  return regions.filter((r) => !linked.has(r.name));
}
