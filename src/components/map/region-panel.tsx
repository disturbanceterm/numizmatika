/**
 * Bočni panel mape: izabrani region, povezani izdavači, popunjenost, "Otvori album".
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 */
"use client";

import { BookOpen, Link2, X } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { RegionFill } from "@/lib/map-fill";

interface Props {
  region: string;
  year: number;
  fill: RegionFill | undefined;
  onClose: () => void;
}

export function RegionPanel({ region, year, fill, onClose }: Props) {
  const pct = fill?.ratio != null ? Math.round(fill.ratio * 100) : null;

  return (
    <aside className="flex w-full flex-col gap-4 rounded-xl border bg-background/95 p-4 shadow-lg backdrop-blur sm:w-80">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground">Region na mapi · {year}</p>
          <h2 className="text-lg font-semibold leading-tight">{region}</h2>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Zatvori">
          <X />
        </Button>
      </div>

      {!fill || fill.issuers.length === 0 ? (
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Ovaj region još nije povezan ni sa jednim Numista izdavačem, pa nema albuma.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href={`/podesavanja?region=${encodeURIComponent(region)}`}>
              <Link2 data-icon="inline-start" />
              Poveži sa izdavačem
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-muted-foreground">Popunjenost</span>
              <span className="font-mono font-medium">
                {fill.loaded ? `${fill.owned} / ${fill.total}` : "katalog nije učitan"}
              </span>
            </div>
            <Progress value={pct ?? 0} />
            {pct != null && <p className="text-right text-xs text-muted-foreground">{pct}%</p>}
          </div>

          <ul className="space-y-2">
            {fill.issuers.map((i) => (
              <li key={i.code} className="flex items-center justify-between gap-2 rounded-lg border p-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{i.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {i.loaded ? `${i.owned} od ${i.total} u kolekciji` : "Katalog nije učitan"}
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link href={`/drzava/${encodeURIComponent(i.code)}`}>
                    <BookOpen data-icon="inline-start" />
                    Album
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}
    </aside>
  );
}
