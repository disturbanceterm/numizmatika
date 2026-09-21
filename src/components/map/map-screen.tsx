/**
 * Ekran mape: stanje godine i izabranog regiona, dovlačenje popunjenosti, raspored panela.
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 */
"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import type { MapFillResponse, RegionFill } from "@/lib/map-fill";
import { DEFAULT_MAP_YEAR, type MapYear } from "@/lib/map-years";

import type { HoverInfo } from "./historical-map";
import { Legend } from "./legend";
import { RegionPanel } from "./region-panel";
import { YearSlider } from "./year-slider";

// REASON: MapLibre koristi window/WebGL – ne smije se renderovati na serveru.
const HistoricalMap = dynamic(() => import("./historical-map").then((m) => m.HistoricalMap), {
  ssr: false,
  loading: () => <Skeleton className="absolute inset-0 rounded-none" />,
});

export function MapScreen() {
  const [year, setYear] = useState<MapYear>(DEFAULT_MAP_YEAR);
  const [fills, setFills] = useState<Record<string, RegionFill>>({});
  const [fillError, setFillError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<HoverInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/map/fill?year=${year}`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? `HTTP ${r.status}`);
        return r.json() as Promise<MapFillResponse>;
      })
      .then((d) => {
        if (cancelled) return;
        setFills(d.regions);
        setFillError(null);
      })
      .catch((e: Error) => {
        if (!cancelled) setFillError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [year]);

  const onSelect = useCallback((name: string | null) => setSelected(name), []);
  const onHover = useCallback((info: HoverInfo | null) => setHover(info), []);

  const selectedFill = useMemo(() => (selected ? fills[selected] : undefined), [fills, selected]);
  const linkedCount = Object.keys(fills).length;

  return (
    <div className="relative flex-1 overflow-hidden">
      <HistoricalMap year={year} fills={fills} selected={selected} onSelect={onSelect} onHover={onHover} />

      {hover && !selected && (
        <div
          className="pointer-events-none absolute z-10 rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background shadow"
          style={{ left: hover.x + 12, top: hover.y + 12 }}
        >
          {hover.name}
          {fills[hover.name] && fills[hover.name].ratio != null && (
            <span className="ml-1.5 opacity-70">{Math.round(fills[hover.name].ratio! * 100)}%</span>
          )}
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-3 p-3 sm:p-4">
        <div className="pointer-events-auto rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur sm:max-w-2xl">
          <YearSlider year={year} onChange={setYear} />
          <p className="mt-2 text-xs text-muted-foreground">
            Klikni državu za album. {linkedCount} regiona povezano sa Numista izdavačima za {year}.
            {fillError && <span className="text-destructive"> Greška: {fillError}</span>}
          </p>
        </div>
      </div>

      {selected && (
        <div className="absolute inset-x-3 bottom-3 z-10 sm:inset-x-auto sm:top-4 sm:right-4 sm:bottom-auto">
          <RegionPanel region={selected} year={year} fill={selectedFill} onClose={() => setSelected(null)} />
        </div>
      )}

      <div className="absolute bottom-10 left-3 z-10 hidden sm:block">
        <Legend />
      </div>
    </div>
  );
}
