/**
 * GET /api/issuers?q=serb – pretraga keširanih Numista izdavača (za povezivanje regiona).
 * Ako izdavači još nisu sinhronizovani, prvo ih dovlači (1 poziv, ~4200 redova).
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 */
import { handleError, ok } from "@/lib/api";
import { getIssuersSyncedAt, searchIssuers, syncIssuers } from "@/lib/catalog";

export async function GET(request: Request) {
  try {
    const q = new URL(request.url).searchParams.get("q") ?? "";
    let syncedAt = await getIssuersSyncedAt();
    if (!syncedAt) {
      await syncIssuers();
      syncedAt = await getIssuersSyncedAt();
    }
    const issuers = await searchIssuers(q);
    return ok({ syncedAt, issuers });
  } catch (e) {
    return handleError(e);
  }
}
