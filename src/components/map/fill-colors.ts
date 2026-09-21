/**
 * Paleta bojenja regiona po popunjenosti (stil "Victoria 3": pergament -> bronza).
 * Dijeli se između mape (MapLibre izrazi) i legende.
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 */

export const OCEAN = "#aebfcc";
export const LAND_UNLINKED = "#e6e1d5";
export const LAND_LINKED_NOT_LOADED = "#cdc4ab";
export const BORDER = "#5f5140";

/** Kontrolne tačke gradijenta: [udio 0..1, boja]. */
export const FILL_STOPS: [number, string][] = [
  [0, "#f3e7c6"],
  [0.15, "#e9cf8a"],
  [0.4, "#d4a437"],
  [0.7, "#b0781f"],
  [1, "#7a4d0f"],
];

function hex(c: string): [number, number, number] {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Interpolira boju za udio 0..1 (ista logika koju mapa dobija kroz `match` izraz). */
export function colorForRatio(ratio: number): string {
  const r = Math.min(1, Math.max(0, ratio));
  for (let i = 1; i < FILL_STOPS.length; i++) {
    const [r0, c0] = FILL_STOPS[i - 1];
    const [r1, c1] = FILL_STOPS[i];
    if (r <= r1) {
      const t = (r - r0) / (r1 - r0);
      const a = hex(c0);
      const b = hex(c1);
      const mix = a.map((v, k) => Math.round(v + (b[k] - v) * t));
      return `#${mix.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
    }
  }
  return FILL_STOPS[FILL_STOPS.length - 1][1];
}
