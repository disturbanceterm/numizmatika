/**
 * POST /api/issuers/sync – ponovo dovuci listu izdavača sa Numiste (1 poziv).
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 */
import { handleError, ok } from "@/lib/api";
import { getIssuersSyncedAt, syncIssuers } from "@/lib/catalog";

export async function POST() {
  try {
    const result = await syncIssuers();
    return ok({ ...result, syncedAt: await getIssuersSyncedAt() });
  } catch (e) {
    return handleError(e);
  }
}
