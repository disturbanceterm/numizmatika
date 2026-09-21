/**
 * /kolekcija – sve što imaš: statistika, pretraga (?q=), lista komada sa brisanjem.
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

import { DeleteItemButton } from "@/components/collection/delete-item-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { getCollectionStats, listItems, uploadUrl } from "@/lib/collection";

export const metadata: Metadata = { title: "Kolekcija" };

export default async function CollectionPage({ searchParams }: PageProps<"/kolekcija">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const [items, stats] = await Promise.all([listItems(q), getCollectionStats()]);
  const pct = stats.catalogTotal > 0 ? Math.round((stats.catalogOwned / stats.catalogTotal) * 100) : 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Kolekcija</h1>
          <p className="text-sm text-muted-foreground">Sve što imaš, iz svih albuma.</p>
        </div>
        <form className="flex w-full gap-2 sm:w-auto" action="/kolekcija" method="get">
          <Input name="q" defaultValue={q} placeholder="Pretraži naziv, valutu, državu, napomenu…" className="sm:w-80" />
          <Button type="submit" variant="outline">
            <Search data-icon="inline-start" />
            Traži
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card size="sm">
          <CardHeader>
            <CardDescription>Komada</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{stats.pieces}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">{stats.items} unosa · {stats.types} različitih tipova</CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Novčanice / kovanice</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {stats.banknotes} / {stats.coins}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">različitih tipova</CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Država (izdavača)</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{stats.issuers}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">{stats.perIssuer.length} učitanih kataloga</CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Popunjenost učitanih kataloga</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{pct}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={pct} />
            <p className="mt-1 text-xs text-muted-foreground">
              {stats.catalogOwned} od {stats.catalogTotal} tipova
            </p>
          </CardContent>
        </Card>
      </div>

      {stats.perIssuer.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {stats.perIssuer.map((i) => (
            <Link key={i.code} href={`/drzava/${encodeURIComponent(i.code)}`}>
              <Badge variant="outline" className="h-6 gap-1.5 px-2.5">
                {i.name}
                <span className="font-mono text-muted-foreground">
                  {i.owned}/{i.total}
                </span>
              </Badge>
            </Link>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed p-12 text-center">
          <p className="text-lg font-medium">{q ? "Ništa ne odgovara pretrazi" : "Kolekcija je prazna"}</p>
          <p className="max-w-md text-sm text-muted-foreground">
            {q ? "Probaj drugi pojam ili obriši filter." : "Otvori mapu, klikni državu i u albumu dodaj prvi komad."}
          </p>
          <Button asChild variant="outline">
            <Link href={q ? "/kolekcija" : "/"}>{q ? "Sve" : "Na mapu"}</Link>
          </Button>
        </div>
      ) : (
        <ul className="divide-y overflow-hidden rounded-2xl border">
          {items.map((it) => {
            const img = uploadUrl(it.imagePath) ?? it.type.obverseThumb;
            const isCoin = it.type.category === "coin";
            return (
              <li key={it.id} className="flex items-center gap-3 p-3 hover:bg-muted/40">
                <div
                  className={`flex size-14 shrink-0 items-center justify-center overflow-hidden border bg-stone-100 ${isCoin ? "rounded-full" : "rounded-md"}`}
                >
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element -- lokalni upload ili Numista thumbnail
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="px-1 text-center font-serif text-[11px] leading-tight text-stone-500">
                      {it.type.valueText ?? it.type.title}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    <Link href={`/drzava/${encodeURIComponent(it.type.issuerCode)}`} className="hover:underline">
                      {it.type.title}
                    </Link>
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {it.type.issuer.name}
                    {it.type.currencyName ? ` · ${it.type.currencyName}` : ""}
                    {it.year ? ` · ${it.year}` : ""}
                    {it.note ? ` · ${it.note}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {it.grade && <Badge variant="secondary">{it.grade}</Badge>}
                  {it.quantity > 1 && <Badge variant="outline">×{it.quantity}</Badge>}
                  {it.price != null && <span className="hidden font-mono text-sm text-muted-foreground sm:inline">{it.price.toFixed(2)}</span>}
                  <DeleteItemButton id={it.id} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
