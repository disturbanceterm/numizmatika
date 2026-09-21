/**
 * Album izdavača: zaglavlje sa statistikom, "Učitaj katalog", filter novčanice/kovanice,
 * grupe po valuti/periodu sa mrežom sličica, dijalog dodavanja.
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 * 2026-09-21  Klik na sličicu otvara TypeDialog (veliki prikaz lica/naličja) umjesto direktno forme.
 * 2026-09-21  refresh() više ne guta greške – neuspjelo ponovno učitavanje albuma se prikazuje.
 */
"use client";

import { ArrowLeft, Download, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Tile } from "@/components/album/tile";
import { TypeDialog } from "@/components/album/type-dialog";
import type { UsageInfo } from "@/components/quota-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Album, AlbumTile } from "@/lib/catalog";

type Filter = "all" | "banknote" | "coin";

interface Props {
  initial: Album;
  usage: UsageInfo;
}

interface LoadState {
  phase: "idle" | "catalog" | "details" | "done" | "error";
  message?: string;
}

export function AlbumView({ initial, usage: initialUsage }: Props) {
  const [album, setAlbum] = useState<Album>(initial);
  const [usage, setUsage] = useState<UsageInfo>(initialUsage);
  const [filter, setFilter] = useState<Filter>("all");
  const [active, setActive] = useState<AlbumTile | null>(null);
  const [load, setLoad] = useState<LoadState>({ phase: "idle" });

  const code = album.issuer.code;

  const refresh = useCallback(async () => {
    const r = await fetch(`/api/issuers/${encodeURIComponent(code)}/catalog`, { cache: "no-store" });
    if (!r.ok) {
      const d = (await r.json().catch(() => ({}))) as { error?: string };
      throw new Error(`Album se nije učitao (HTTP ${r.status}): ${d.error ?? "nepoznata greška"}`);
    }
    setAlbum((await r.json()) as Album);
  }, [code]);

  const fillDetails = useCallback(async () => {
    setLoad({ phase: "details", message: "Popunjavam valute (detalji tipova)…" });
    const r = await fetch(`/api/issuers/${encodeURIComponent(code)}/details`, { method: "POST" });
    const d = (await r.json()) as {
      fetched?: number;
      remaining?: number;
      stoppedReason?: string;
      error?: string;
      usage?: UsageInfo;
    };
    if (d.usage) setUsage(d.usage);
    if (!r.ok) {
      setLoad({ phase: "error", message: d.error ?? `HTTP ${r.status}` });
      return;
    }
    try {
      await refresh();
    } catch (e) {
      setLoad({ phase: "error", message: (e as Error).message });
      return;
    }
    const tail =
      d.stoppedReason === "budget"
        ? ` Budžet po sesiji potrošen – još ${d.remaining} čeka sledeće otvaranje.`
        : d.stoppedReason === "quota"
          ? ` Stalo zbog kvote: ${d.error ?? ""}`
          : d.stoppedReason === "error"
            ? ` Greška: ${d.error ?? ""}`
            : "";
    setLoad({ phase: "done", message: `Popunjeno ${d.fetched ?? 0} tipova.${tail}` });
  }, [code, refresh]);

  // REASON: Lijeno dovlačenje po planu – pri otvaranju albuma popuni valute do budžeta, u pozadini.
  useEffect(() => {
    if (!(initial.total > 0 && initial.withoutDetail > 0)) return;
    const t = setTimeout(() => void fillDetails(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadCatalog() {
    setLoad({ phase: "catalog", message: "Dovlačim katalog sa Numiste (1 poziv na 50 komada)…" });
    try {
      const r = await fetch(`/api/issuers/${encodeURIComponent(code)}/catalog`, { method: "POST" });
      const d = (await r.json()) as { total?: number; loaded?: number; pages?: number; error?: string; usage?: UsageInfo };
      if (d.usage) setUsage(d.usage);
      if (!r.ok) throw new Error(d.error ?? `HTTP ${r.status}`);
      await refresh();
      await fillDetails();
    } catch (e) {
      setLoad({ phase: "error", message: (e as Error).message });
    }
  }

  const groups = useMemo(() => {
    if (filter === "all") return album.groups;
    return album.groups
      .map((g) => ({ ...g, tiles: g.tiles.filter((t) => t.category === filter) }))
      .filter((g) => g.tiles.length > 0);
  }, [album, filter]);

  const pct = album.total > 0 ? Math.round((album.owned / album.total) * 100) : 0;
  const busy = load.phase === "catalog" || load.phase === "details";

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 rounded-2xl border bg-gradient-to-br from-stone-50 to-amber-50/60 p-4 sm:p-6">
        <div className="flex flex-wrap items-start gap-4">
          <Button asChild variant="ghost" size="icon-sm" className="mt-0.5">
            <Link href="/" aria-label="Nazad na mapu">
              <ArrowLeft />
            </Link>
          </Button>
          {album.issuer.flag && (
            // eslint-disable-next-line @next/next/no-img-element -- vanjska Numista zastava
            <img src={album.issuer.flag} alt="" className="mt-1 h-7 rounded-sm border shadow-sm" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Album izdavača · Numista kod: {code}</p>
            <h1 className="text-2xl font-semibold tracking-tight">{album.issuer.name}</h1>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge variant="secondary">{album.counts.banknote} novčanica</Badge>
              <Badge variant="secondary">{album.counts.coin} kovanica</Badge>
              {album.counts.exonumia > 0 && <Badge variant="outline">{album.counts.exonumia} ostalo</Badge>}
              {album.withoutDetail > 0 && <Badge variant="outline">{album.withoutDetail} bez valute</Badge>}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button onClick={loadCatalog} disabled={busy} variant={album.total === 0 ? "default" : "outline"}>
              {busy ? <Loader2 className="animate-spin" data-icon="inline-start" /> : album.total === 0 ? <Download data-icon="inline-start" /> : <RefreshCw data-icon="inline-start" />}
              {album.total === 0 ? "Učitaj katalog sa Numiste" : "Osvježi katalog"}
            </Button>
            <p className="text-xs text-muted-foreground">
              {usage.sampleMode ? "Probni katalog – bez potrošnje kvote" : `Kvota: ${usage.calls}/${usage.quota} · budžet detalja ${usage.detailBudget}`}
            </p>
          </div>
        </div>

        {album.total > 0 && (
          <div className="flex items-center gap-3">
            <Progress value={pct} className="flex-1" />
            <span className="font-mono text-sm tabular-nums">
              {album.owned}/{album.total} · {pct}%
            </span>
          </div>
        )}

        {load.message && (
          <p className={`text-sm ${load.phase === "error" ? "text-destructive" : "text-muted-foreground"}`}>{load.message}</p>
        )}
      </div>

      {album.total === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed p-12 text-center">
          <p className="text-lg font-medium">Katalog još nije učitan</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Klikni „Učitaj katalog sa Numiste“ – dovući će sve novčanice i kovanice ovog izdavača i trajno ih sačuvati u lokalnu bazu.
            {usage.sampleMode && code !== "yougoslavie" && " U probnom režimu katalog postoji samo za Jugoslaviju."}
          </p>
        </div>
      ) : (
        <>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
            <TabsList>
              <TabsTrigger value="all">Sve ({album.total})</TabsTrigger>
              <TabsTrigger value="banknote">Novčanice ({album.counts.banknote})</TabsTrigger>
              <TabsTrigger value="coin">Kovanice ({album.counts.coin})</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-col gap-8">
            {groups.map((g) => {
              const ownedInView = g.tiles.filter((t) => t.items.length > 0).length;
              return (
                <section key={g.key} className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h2 className="text-lg font-semibold">{g.label}</h2>
                    {!g.known && <Badge variant="outline">valuta još nije dovučena</Badge>}
                    <span className="text-sm text-muted-foreground">
                      {ownedInView}/{g.tiles.length} u kolekciji
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                    {g.tiles.map((t) => (
                      <Tile key={t.id} tile={t} onAdd={setActive} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}

      <TypeDialog
        tile={active}
        onClose={() => setActive(null)}
        onSaved={async () => {
          setActive(null);
          await refresh();
        }}
      />
    </div>
  );
}
