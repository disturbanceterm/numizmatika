/**
 * /podesavanja – status ključa i kvote, sinhronizacija izdavača, veze region ↔ izdavač,
 * nepovezani regioni sa mape.
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 */
import type { Metadata } from "next";

import { RegionLinker } from "@/components/settings/region-linker";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getIssuersSyncedAt } from "@/lib/catalog";
import { getUsage } from "@/lib/numista/client";
import { getAllLinks, getAllMapRegions } from "@/lib/region-links";

export const metadata: Metadata = { title: "Podešavanja" };

export default async function SettingsPage({ searchParams }: PageProps<"/podesavanja">) {
  const sp = await searchParams;
  const preselect = typeof sp.region === "string" ? sp.region : null;

  const [usage, syncedAt, links, regions] = await Promise.all([
    getUsage(),
    getIssuersSyncedAt(),
    getAllLinks(),
    getAllMapRegions(),
  ]);
  const pct = usage.quota > 0 ? Math.round((usage.calls / usage.quota) * 100) : 0;
  const linkedNames = new Set(links.map((l) => l.regionName));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Podešavanja</h1>
        <p className="text-sm text-muted-foreground">Numista ključ, kvota i povezivanje regiona sa mape sa izdavačima.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardDescription>Numista API ključ</CardDescription>
            <CardTitle className="flex items-center gap-2">
              {usage.sampleMode ? (
                <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-900">
                  nije postavljen
                </Badge>
              ) : (
                <Badge className="bg-emerald-600 text-white">aktivan</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {usage.sampleMode ? (
              <>
                Radi ugrađeni probni katalog (Jugoslavija). Za pravi katalog dodaj <code>NUMISTA_API_KEY</code> u <code>.env</code>{" "}
                (ili u Cursor Dashboard → Cloud Agents → Secrets) i restartuj server.
              </>
            ) : (
              <>Ključ se čita iz okruženja i nikad se ne prikazuje.</>
            )}
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Kvota · {usage.month}</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {usage.calls} / {usage.quota}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={pct} />
            <p className="mt-1 text-xs text-muted-foreground">
              Preostalo {usage.remaining} poziva · budžet detalja po albumu: {usage.detailBudget}
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Keš izdavača (GET /issuers)</CardDescription>
            <CardTitle className="text-base">
              {syncedAt ? `Sinhronizovano ${syncedAt.toLocaleDateString("bs-Latn-BA")}` : "Još nije sinhronizovano"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Lista ~4200 izdavača se dovlači jednom (1 poziv) pri prvoj pretrazi ispod.
          </CardContent>
        </Card>
      </div>

      <RegionLinker
        initialLinks={links.map((l) => ({
          id: l.id,
          regionName: l.regionName,
          issuerCode: l.issuerCode,
          issuerName: l.issuer.name,
          issuerLevel: l.issuer.level,
          yearFrom: l.yearFrom,
          yearTo: l.yearTo,
          source: l.source,
        }))}
        regions={regions.map((r) => ({ name: r.name, years: r.years, linked: linkedNames.has(r.name) }))}
        preselectRegion={preselect}
        issuersSynced={!!syncedAt}
      />
    </div>
  );
}
