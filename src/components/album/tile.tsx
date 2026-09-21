/**
 * Jedna "sličica" u albumu: novčanica (3:2) ili kovanica (krug). Posjedovano = u boji sa tvojom
 * slikom i ocjenom; neposjedovano = izblijedjela silueta / sivi thumbnail.
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 */
"use client";

import { Plus } from "lucide-react";

import type { AlbumTile } from "@/lib/catalog";
import { cn } from "@/lib/utils";

interface Props {
  tile: AlbumTile;
  onAdd: (tile: AlbumTile) => void;
}

function yearsLabel(t: AlbumTile) {
  if (t.minYear == null) return "";
  return t.maxYear != null && t.maxYear !== t.minYear ? `${t.minYear}–${t.maxYear}` : String(t.minYear);
}

export function Tile({ tile, onAdd }: Props) {
  const owned = tile.items.length > 0;
  const isCoin = tile.category === "coin";
  const ownImage = tile.items.find((i) => i.imagePath)?.imagePath ?? null;
  const image = ownImage ? `/api/uploads/${encodeURIComponent(ownImage)}` : tile.obverseThumb;
  const best = tile.items[0];
  const qty = tile.items.reduce((s, i) => s + i.quantity, 0);
  const value = tile.valueText ?? tile.title.split(" - ")[0];

  return (
    <button
      type="button"
      onClick={() => onAdd(tile)}
      title={`${tile.title}${yearsLabel(tile) ? ` (${yearsLabel(tile)})` : ""} · N# ${tile.id}`}
      className={cn(
        "group relative flex flex-col gap-1.5 rounded-lg p-1.5 text-left transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
      )}
    >
      <div
        className={cn(
          "relative flex w-full items-center justify-center overflow-hidden border shadow-sm transition-transform group-hover:scale-[1.02]",
          isCoin ? "aspect-square rounded-full" : "aspect-[3/2] rounded-md",
          owned
            ? isCoin
              ? "border-amber-700/50 bg-gradient-to-br from-amber-200 via-yellow-100 to-amber-300"
              : "border-emerald-800/40 bg-gradient-to-br from-emerald-100 via-stone-50 to-emerald-200"
            : "border-dashed border-stone-300 bg-stone-100",
        )}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element -- vanjski Numista thumbnail / lokalni upload
          <img
            src={image}
            alt=""
            loading="lazy"
            className={cn(
              "h-full w-full object-cover",
              owned ? "" : "opacity-40 grayscale",
            )}
          />
        ) : (
          <div className={cn("flex flex-col items-center px-1 text-center", owned ? "text-stone-800" : "text-stone-400")}>
            <span className={cn("font-serif leading-none font-semibold", isCoin ? "text-base" : "text-lg")}>{value}</span>
            <span className="mt-0.5 text-[10px] leading-none">{yearsLabel(tile)}</span>
          </div>
        )}

        {owned ? (
          <span className="absolute right-1 bottom-1 flex items-center gap-1 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {best?.grade ?? "✓"}
            {qty > 1 && <span className="opacity-80">×{qty}</span>}
          </span>
        ) : (
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity group-hover:opacity-100">
            <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-2 py-0.5 text-[11px] font-medium text-background shadow">
              <Plus className="size-3" /> Dodaj
            </span>
          </span>
        )}
      </div>
      <div className="min-w-0 px-0.5">
        <p className={cn("truncate text-xs leading-tight font-medium", owned ? "" : "text-muted-foreground")}>{tile.title}</p>
        <p className="truncate text-[11px] leading-tight text-muted-foreground">
          {yearsLabel(tile)}
          {tile.objectTypeName && !/^standard/i.test(tile.objectTypeName) ? ` · ${tile.objectTypeName}` : ""}
        </p>
      </div>
    </button>
  );
}
