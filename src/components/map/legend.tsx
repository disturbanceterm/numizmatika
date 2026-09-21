/**
 * Legenda boja na mapi.
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 */
"use client";

import { FILL_STOPS, LAND_LINKED_NOT_LOADED, LAND_UNLINKED } from "./fill-colors";

export function Legend() {
  const gradient = `linear-gradient(to right, ${FILL_STOPS.map(([r, c]) => `${c} ${r * 100}%`).join(", ")})`;
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-background/95 p-3 text-xs shadow backdrop-blur">
      <div className="flex items-center gap-2">
        <span className="inline-block size-3 rounded-sm border" style={{ background: LAND_UNLINKED }} />
        <span className="text-muted-foreground">Nepovezan region</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-block size-3 rounded-sm border" style={{ background: LAND_LINKED_NOT_LOADED }} />
        <span className="text-muted-foreground">Povezan, katalog nije učitan</span>
      </div>
      <div className="flex flex-col gap-1">
        <div className="h-3 w-40 rounded-sm border" style={{ background: gradient }} />
        <div className="flex justify-between text-muted-foreground">
          <span>0 % kolekcije</span>
          <span>100 %</span>
        </div>
      </div>
    </div>
  );
}
