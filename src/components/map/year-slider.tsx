/**
 * Klizač godina (diskretne vrijednosti iz MAP_YEARS) sa tasterima naprijed/nazad.
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 */
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { MAP_YEARS, type MapYear } from "@/lib/map-years";

interface Props {
  year: MapYear;
  onChange: (year: MapYear) => void;
}

export function YearSlider({ year, onChange }: Props) {
  const index = MAP_YEARS.indexOf(year);
  const set = (i: number) => onChange(MAP_YEARS[Math.min(MAP_YEARS.length - 1, Math.max(0, i))]);

  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" size="icon-sm" onClick={() => set(index - 1)} disabled={index === 0} aria-label="Ranija godina">
        <ChevronLeft />
      </Button>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Slider
          min={0}
          max={MAP_YEARS.length - 1}
          step={1}
          value={[index]}
          onValueChange={(v) => set(v[0] ?? 0)}
          aria-label="Godina mape"
        />
        <div className="flex justify-between text-[10px] leading-none text-muted-foreground select-none">
          {MAP_YEARS.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => onChange(y)}
              className={y === year ? "font-semibold text-foreground" : "hover:text-foreground"}
            >
              {y}
            </button>
          ))}
        </div>
      </div>
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => set(index + 1)}
        disabled={index === MAP_YEARS.length - 1}
        aria-label="Kasnija godina"
      >
        <ChevronRight />
      </Button>
      <div className="w-14 text-right font-mono text-2xl font-semibold tabular-nums">{year}</div>
    </div>
  );
}
