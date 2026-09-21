/**
 * Povezivanje regiona sa mape sa Numista izdavačima: izbor regiona (nepovezani prvo),
 * pretraga izdavača (GET /api/issuers?q=), opcioni raspon godina, lista postojećih veza.
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 */
"use client";

import { AlertTriangle, Link2, Loader2, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface LinkRow {
  id: number;
  regionName: string;
  issuerCode: string;
  issuerName: string;
  issuerLevel: number | null;
  yearFrom: number | null;
  yearTo: number | null;
  source: string;
}

export interface RegionRow {
  name: string;
  years: number[];
  linked: boolean;
}

interface IssuerHit {
  code: string;
  name: string;
  parentName: string | null;
  level: number | null;
}

interface Props {
  initialLinks: LinkRow[];
  regions: RegionRow[];
  preselectRegion: string | null;
  issuersSynced: boolean;
}

export function RegionLinker({ initialLinks, regions, preselectRegion, issuersSynced }: Props) {
  const router = useRouter();
  const [regionQuery, setRegionQuery] = useState(preselectRegion ?? "");
  const [region, setRegion] = useState<string | null>(preselectRegion);
  const [issuerQuery, setIssuerQuery] = useState("");
  const [hits, setHits] = useState<IssuerHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [issuer, setIssuer] = useState<IssuerHit | null>(null);
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkFilter, setLinkFilter] = useState("");

  const filteredRegions = useMemo(() => {
    const q = regionQuery.trim().toLowerCase();
    const list = q ? regions.filter((r) => r.name.toLowerCase().includes(q)) : regions;
    // REASON: Nepovezani regioni idu prvo – to je ono što korisnik ovdje traži.
    return [...list].sort((a, b) => Number(a.linked) - Number(b.linked) || a.name.localeCompare(b.name)).slice(0, 60);
  }, [regions, regionQuery]);

  const unlinkedCount = regions.filter((r) => !r.linked).length;

  useEffect(() => {
    const q = issuerQuery.trim();
    if (q.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setSearching(true);
      setError(null);
      try {
        const r = await fetch(`/api/issuers?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const d = (await r.json()) as { issuers?: IssuerHit[]; error?: string };
        if (!r.ok) throw new Error(d.error ?? `HTTP ${r.status}`);
        setHits(d.issuers ?? []);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError((e as Error).message);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [issuerQuery]);

  async function save() {
    if (!region || !issuer) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/region-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regionName: region,
          issuerCode: issuer.code,
          yearFrom: yearFrom ? Number(yearFrom) : null,
          yearTo: yearTo ? Number(yearTo) : null,
        }),
      });
      const d = (await r.json()) as { error?: string };
      if (!r.ok) throw new Error(d.error ?? `HTTP ${r.status}`);
      setIssuer(null);
      setIssuerQuery("");
      setYearFrom("");
      setYearTo("");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Ukloniti ovu vezu?")) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/region-links/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error(((await r.json()) as { error?: string }).error ?? `HTTP ${r.status}`);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const visibleLinks = useMemo(() => {
    const q = linkFilter.trim().toLowerCase();
    return q
      ? initialLinks.filter((l) => l.regionName.toLowerCase().includes(q) || l.issuerName.toLowerCase().includes(q) || l.issuerCode.includes(q))
      : initialLinks;
  }, [initialLinks, linkFilter]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="size-4" /> Poveži region sa izdavačem
          </CardTitle>
          <CardDescription>
            {unlinkedCount} od {regions.length} regiona sa mapa još nema izdavača. Region može imati više veza (npr. po periodima).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>1. Region sa mape</Label>
            <Input value={regionQuery} onChange={(e) => setRegionQuery(e.target.value)} placeholder="Traži ime regiona (NAME iz GeoJSON-a)…" />
            <ScrollArea className="h-44 rounded-lg border">
              <ul className="p-1">
                {filteredRegions.map((r) => (
                  <li key={r.name}>
                    <button
                      type="button"
                      onClick={() => setRegion(r.name)}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
                        region === r.name && "bg-muted font-medium",
                      )}
                    >
                      <span className="truncate">{r.name}</span>
                      <span className="flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground">
                        {r.years[0]}–{r.years[r.years.length - 1]}
                        {r.linked ? <Badge variant="secondary">povezan</Badge> : <Badge variant="outline">nepovezan</Badge>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
            {region && (
              <p className="text-xs">
                Izabran: <span className="font-medium">{region}</span>
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="issuer-q">2. Numista izdavač</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="issuer-q"
                className="pl-8"
                value={issuerQuery}
                onChange={(e) => setIssuerQuery(e.target.value)}
                placeholder={issuersSynced ? "npr. Serbia, Yugoslavia, Ottoman…" : "Prva pretraga dovlači listu izdavača (1 poziv)…"}
              />
              {searching && <Loader2 className="absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
            </div>
            {issuerQuery.trim().length >= 2 && hits.length > 0 && (
              <ScrollArea className="h-40 rounded-lg border">
                <ul className="p-1">
                  {hits.map((h) => (
                    <li key={h.code}>
                      <button
                        type="button"
                        onClick={() => setIssuer(h)}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
                          issuer?.code === h.code && "bg-muted font-medium",
                        )}
                      >
                        <span className="truncate">
                          {h.name}
                          {h.parentName && h.parentName !== h.name && <span className="text-muted-foreground"> · {h.parentName}</span>}
                        </span>
                        <code className="shrink-0 text-[10px] text-muted-foreground">{h.code}</code>
                      </button>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
            {issuer && (
              <p className="text-xs">
                Izabran: <span className="font-medium">{issuer.name}</span> <code className="text-muted-foreground">({issuer.code})</code>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="yf">Od godine (opciono)</Label>
              <Input id="yf" inputMode="numeric" value={yearFrom} onChange={(e) => setYearFrom(e.target.value)} placeholder="npr. 1918" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="yt">Do godine (opciono)</Label>
              <Input id="yt" inputMode="numeric" value={yearTo} onChange={(e) => setYearTo(e.target.value)} placeholder="npr. 1941" />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button onClick={save} disabled={!region || !issuer || busy}>
            {busy && <Loader2 className="animate-spin" data-icon="inline-start" />}
            Sačuvaj vezu
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Postojeće veze ({initialLinks.length})</CardTitle>
          <CardDescription>
            Veze iz <code>data/region-links.json</code> su označene kao „seed“; one sa <AlertTriangle className="inline size-3 text-amber-600" /> imaju
            nepotvrđen Numista kod – provjeri ih kad sinhronizuješ izdavače.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Input value={linkFilter} onChange={(e) => setLinkFilter(e.target.value)} placeholder="Filtriraj veze…" />
          <ScrollArea className="h-[28rem] rounded-lg border">
            <ul className="divide-y">
              {visibleLinks.map((l) => {
                const unverified = l.source === "seed-unverified" || (issuersSynced && l.issuerLevel == null);
                return (
                  <li key={l.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {l.regionName} <span className="text-muted-foreground">→</span> {l.issuerName}
                      </p>
                      <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <code>{l.issuerCode}</code>
                        {(l.yearFrom != null || l.yearTo != null) && (
                          <span>
                            {l.yearFrom ?? "…"}–{l.yearTo ?? "…"}
                          </span>
                        )}
                        <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                          {l.source.startsWith("seed") ? "seed" : "ručno"}
                        </Badge>
                        {unverified && (
                          <span className="inline-flex items-center gap-1 text-amber-700">
                            <AlertTriangle className="size-3" /> nepotvrđen kod
                          </span>
                        )}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon-sm" onClick={() => remove(l.id)} disabled={busy} aria-label="Ukloni vezu">
                      <Trash2 />
                    </Button>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
