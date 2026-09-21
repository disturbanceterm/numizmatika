/**
 * Godine za koje imamo granice (public/maps/world_YYYY.geojson, dataset aourednik/historical-basemaps).
 * Dijeli se između servera i klijenta – bez server-only zavisnosti.
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 */

export const MAP_YEARS = [
  1800, 1815, 1880, 1900, 1914, 1920, 1930, 1938, 1945, 1960, 1994, 2000, 2010,
] as const;

export type MapYear = (typeof MAP_YEARS)[number];

export const DEFAULT_MAP_YEAR: MapYear = 1960;

export function isMapYear(n: number): n is MapYear {
  return (MAP_YEARS as readonly number[]).includes(n);
}

export function mapUrl(year: MapYear): string {
  return `/maps/world_${year}.geojson`;
}

/** Osobine koje nas zanimaju iz GeoJSON feature-a. */
export interface RegionProperties {
  NAME?: string | null;
  ABBREVN?: string | null;
  SUBJECTO?: string | null;
  PARTOF?: string | null;
  BORDERPRECISION?: number | null;
}
