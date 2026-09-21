/**
 * Popunjenost regiona za datu godinu mape (bojenje + bočni panel).
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 */
import "server-only";

import { getIssuerStats, type IssuerStats } from "@/lib/catalog";
import { getAllLinks } from "@/lib/region-links";

export interface RegionFill {
  region: string;
  issuers: IssuerStats[];
  total: number;
  owned: number;
  /** 0..1, ili null ako ni jedan katalog nije učitan. */
  ratio: number | null;
  /** Bar jedan povezani izdavač ima učitan katalog. */
  loaded: boolean;
}

export interface MapFillResponse {
  year: number;
  regions: Record<string, RegionFill>;
}

export async function getMapFill(year: number): Promise<MapFillResponse> {
  const links = await getAllLinks();
  const active = links.filter(
    (l) => (l.yearFrom == null || l.yearFrom <= year) && (l.yearTo == null || l.yearTo >= year),
  );
  const codes = [...new Set(active.map((l) => l.issuerCode))];
  const stats = await getIssuerStats(codes);

  const regions: Record<string, RegionFill> = {};
  for (const l of active) {
    const s = stats.get(l.issuerCode);
    if (!s) continue;
    const r = (regions[l.regionName] ??= {
      region: l.regionName,
      issuers: [],
      total: 0,
      owned: 0,
      ratio: null,
      loaded: false,
    });
    if (r.issuers.some((i) => i.code === s.code)) continue;
    r.issuers.push(s);
    r.total += s.total;
    r.owned += s.owned;
    r.loaded = r.loaded || s.loaded;
  }
  for (const r of Object.values(regions)) {
    r.ratio = r.total > 0 ? r.owned / r.total : null;
  }
  return { year, regions };
}
