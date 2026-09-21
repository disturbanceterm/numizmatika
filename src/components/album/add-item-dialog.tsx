/**
 * Dijalog "Dodaj u kolekciju": godina (iz raspona tipa ili Numista izdanja), stanje, količina,
 * cijena, slika, napomena. Šalje multipart na POST /api/collection.
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 * 2026-09-21  AddItemForm izvezen da ga koristi i TypeDialog (veliki prikaz -> dodavanje).
 */
"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AlbumTile } from "@/lib/catalog";

// REASON: Radix Select ne dozvoljava praznu vrijednost stavke, pa "nepoznata godina" ima sentinel.
const UNKNOWN_YEAR = "__nepoznata__";

const GRADES = ["UNC", "AU", "XF", "VF", "F", "VG", "G", "P"] as const;
const GRADE_LABEL: Record<(typeof GRADES)[number], string> = {
  UNC: "UNC – necirkulisano",
  AU: "AU – skoro necirkulisano",
  XF: "XF – odlično",
  VF: "VF – vrlo dobro",
  F: "F – dobro",
  VG: "VG – slabije",
  G: "G – slabo",
  P: "P – loše",
};

interface Props {
  tile: AlbumTile | null;
  onClose: () => void;
  onSaved: () => void;
}

export function AddItemDialog({ tile, onClose, onSaved }: Props) {
  return (
    <Dialog open={!!tile} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        {/* REASON: `key` po tipu resetuje cijelo stanje forme bez efekata (pravilo React Compiler-a). */}
        {tile && <AddItemForm key={tile.id} tile={tile} onClose={onClose} onSaved={onSaved} />}
      </DialogContent>
    </Dialog>
  );
}

export interface FormProps {
  tile: AlbumTile;
  onClose: () => void;
  onSaved: () => void;
}

export function AddItemForm({ tile, onClose, onSaved }: FormProps) {
  const [year, setYear] = useState<string>(tile.minYear != null ? String(tile.minYear) : "");
  const [grade, setGrade] = useState<string>("VF");
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issueYears, setIssueYears] = useState<number[] | null>(null);
  const [loadingIssues, setLoadingIssues] = useState(false);

  const rangeYears = useMemo(() => {
    if (tile.minYear == null) return [];
    const max = tile.maxYear ?? tile.minYear;
    const ys: number[] = [];
    for (let y = tile.minYear; y <= Math.min(max, tile.minYear + 60); y++) ys.push(y);
    return ys;
  }, [tile]);
  const years = issueYears ?? rangeYears;

  async function loadIssues() {
    setLoadingIssues(true);
    setError(null);
    try {
      const r = await fetch(`/api/types/${tile.id}/issues`);
      const d = (await r.json()) as { years?: number[]; error?: string };
      if (!r.ok) throw new Error(d.error ?? `HTTP ${r.status}`);
      setIssueYears(d.years ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingIssues(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("typeId", String(tile.id));
      if (year && year !== UNKNOWN_YEAR) fd.set("year", year);
      if (grade) fd.set("grade", grade);
      fd.set("quantity", quantity || "1");
      if (price) fd.set("price", price);
      if (note) fd.set("note", note);
      if (file) fd.set("image", file);
      const r = await fetch("/api/collection", { method: "POST", body: fd });
      const d = (await r.json()) as { error?: string };
      if (!r.ok) throw new Error(d.error ?? `HTTP ${r.status}`);
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function removeItem(id: number) {
    if (!confirm("Ukloniti ovaj komad iz kolekcije?")) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/collection/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error(((await r.json()) as { error?: string }).error ?? `HTTP ${r.status}`);
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Dodaj u kolekciju</DialogTitle>
        <DialogDescription>
          {tile.title}
          {tile.currencyName ? ` · ${tile.currencyName}` : ""} · N# {tile.id}
        </DialogDescription>
      </DialogHeader>

      {tile.items.length > 0 && (
        <div className="rounded-lg border bg-muted/40 p-2 text-xs">
          <p className="mb-1 font-medium">Već imaš ({tile.items.length}):</p>
          <ul className="space-y-1">
            {tile.items.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-2">
                <span>
                  {i.year ?? "—"} · {i.grade ?? "bez ocjene"} · ×{i.quantity}
                  {i.note ? ` · ${i.note}` : ""}
                </span>
                <Button type="button" variant="ghost" size="icon-xs" onClick={() => removeItem(i.id)} aria-label="Ukloni">
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="year">Godina</Label>
          {years.length > 0 ? (
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger id="year" className="w-full">
                <SelectValue placeholder="Izaberi" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
                <SelectItem value={UNKNOWN_YEAR}>Nepoznata</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Input id="year" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)} placeholder="npr. 1978" />
          )}
          {issueYears == null && (
            <button
              type="button"
              onClick={loadIssues}
              disabled={loadingIssues}
              className="text-left text-[11px] text-muted-foreground underline-offset-2 hover:underline"
            >
              {loadingIssues ? "Dovlačim izdanja…" : "Dovuci tačne godine sa Numiste (1 poziv)"}
            </button>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="grade">Stanje</Label>
          <Select value={grade} onValueChange={setGrade}>
            <SelectTrigger id="grade" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GRADES.map((g) => (
                <SelectItem key={g} value={g}>
                  {GRADE_LABEL[g]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="quantity">Količina</Label>
          <Input id="quantity" type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="price">Cijena (plaćeno)</Label>
          <Input id="price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="npr. 12.50" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="image">Slika (JPEG/PNG/WebP, do 10 MB)</Label>
        <Input
          id="image"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="note">Napomena</Label>
        <Textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Serija, potpis, odakle je…" />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
          Odustani
        </Button>
        <Button type="submit" disabled={busy}>
          {busy && <Loader2 className="animate-spin" data-icon="inline-start" />}
          Sačuvaj
        </Button>
      </DialogFooter>
    </form>
  );
}
