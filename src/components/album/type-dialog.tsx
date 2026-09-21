/**
 * Dijalog jednog tipa: veliki prikaz lica i naličja (puna Numista slika ili tvoja fotografija),
 * osnovni podaci, tvoji komadi, i prelaz na formu "Dodaj u kolekciju".
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 */
"use client";

import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { AddItemForm } from "@/components/album/add-item-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AlbumTile } from "@/lib/catalog";
import { cn } from "@/lib/utils";

interface Props {
  tile: AlbumTile | null;
  onClose: () => void;
  onSaved: () => void;
}

export function TypeDialog({ tile, onClose, onSaved }: Props) {
  return (
    <Dialog open={!!tile} onOpenChange={(o) => !o && onClose()}>
      {/* REASON: `key` po tipu resetuje prikaz (detalj/forma) i stanje forme bez efekata. */}
      {tile && <TypeDialogBody key={tile.id} tile={tile} onClose={onClose} onSaved={onSaved} />}
    </Dialog>
  );
}

function yearsLabel(t: AlbumTile) {
  if (t.minYear == null) return "";
  return t.maxYear != null && t.maxYear !== t.minYear ? `${t.minYear}–${t.maxYear}` : String(t.minYear);
}

function TypeDialogBody({ tile, onClose, onSaved }: { tile: AlbumTile; onClose: () => void; onSaved: () => void }) {
  const [mode, setMode] = useState<"detail" | "add">("detail");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (mode === "add") {
    return (
      <DialogContent className="sm:max-w-md">
        <AddItemForm tile={tile} onClose={() => setMode("detail")} onSaved={onSaved} />
      </DialogContent>
    );
  }

  const owned = tile.items.length > 0;
  const isCoin = tile.category === "coin";
  const own = tile.items.find((i) => i.imagePath)?.imagePath ?? null;
  const ownUrl = own ? `/api/uploads/${encodeURIComponent(own)}` : null;
  const obverse = tile.obversePicture ?? tile.obverseThumb;
  const reverse = tile.reversePicture ?? tile.reverseThumb;
  const hasAnyImage = !!(ownUrl || obverse || reverse);

  async function removeItem(id: number) {
    if (!confirm("Ukloniti ovaj komad iz kolekcije?")) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/collection/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error(((await r.json()) as { error?: string }).error ?? `HTTP ${r.status}`);
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle className="flex flex-wrap items-center gap-2">
          {tile.title}
          <Badge variant={owned ? "default" : "outline"}>{owned ? "u kolekciji" : "nemaš"}</Badge>
        </DialogTitle>
        <DialogDescription>
          {[tile.currencyName, yearsLabel(tile), tile.objectTypeName, `N# ${tile.id}`].filter(Boolean).join(" · ")}
        </DialogDescription>
      </DialogHeader>

      {hasAnyImage ? (
        <div className={cn("grid gap-4", ownUrl ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
          {ownUrl && <Picture src={ownUrl} label="Tvoj komad" coin={isCoin} highlight />}
          <Picture src={obverse} label="Lice (Numista)" description={tile.obverseDescription} coin={isCoin} faded={!owned} />
          <Picture src={reverse} label="Naličje (Numista)" description={tile.reverseDescription} coin={isCoin} faded={!owned} />
        </div>
      ) : (
        <div
          className={cn(
            "mx-auto flex items-center justify-center border border-dashed bg-stone-100 text-stone-500",
            isCoin ? "size-56 rounded-full" : "aspect-[3/2] w-full max-w-md rounded-lg",
          )}
        >
          <div className="px-4 text-center">
            <p className="font-serif text-3xl font-semibold">{tile.valueText ?? tile.title.split(" - ")[0]}</p>
            <p className="mt-1 text-xs">
              {tile.detailFetched ? "Numista nema sliku za ovaj tip." : "Slika stiže kad se dovuku detalji tipa (Numista ključ)."}
            </p>
          </div>
        </div>
      )}

      {tile.items.length > 0 && (
        <div className="rounded-lg border bg-muted/40 p-3 text-sm">
          <p className="mb-1.5 font-medium">Tvoji komadi ({tile.items.length})</p>
          <ul className="space-y-1">
            {tile.items.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-2">
                <span>
                  {i.year ?? "—"} · {i.grade ?? "bez ocjene"} · ×{i.quantity}
                  {i.price != null ? ` · ${i.price.toFixed(2)}` : ""}
                  {i.note ? ` · ${i.note}` : ""}
                </span>
                <Button type="button" variant="ghost" size="icon-xs" onClick={() => removeItem(i.id)} disabled={busy} aria-label="Ukloni">
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-2">
        {tile.numistaUrl ? (
          <Button asChild variant="link" size="sm" className="px-0">
            <a href={tile.numistaUrl} target="_blank" rel="noreferrer">
              Otvori na Numisti <ExternalLink data-icon="inline-end" />
            </a>
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Zatvori
          </Button>
          <Button type="button" onClick={() => setMode("add")}>
            <Plus data-icon="inline-start" />
            {owned ? "Dodaj još jedan" : "Dodaj u kolekciju"}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

function Picture({
  src,
  label,
  description,
  coin,
  faded,
  highlight,
}: {
  src: string | null;
  label: string;
  description?: string | null;
  coin: boolean;
  faded?: boolean;
  highlight?: boolean;
}) {
  return (
    <figure className="flex flex-col gap-1.5">
      <div
        className={cn(
          "flex items-center justify-center overflow-hidden border bg-stone-50",
          coin ? "aspect-square rounded-full" : "aspect-[3/2] rounded-lg",
          highlight && "ring-2 ring-emerald-600/60",
        )}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- vanjska Numista slika / lokalni upload
          <img src={src} alt={label} className={cn("h-full w-full object-contain", faded && "opacity-60 grayscale")} />
        ) : (
          <span className="text-xs text-muted-foreground">nema slike</span>
        )}
      </div>
      <figcaption className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{label}</span>
        {description ? ` – ${description}` : ""}
      </figcaption>
    </figure>
  );
}
