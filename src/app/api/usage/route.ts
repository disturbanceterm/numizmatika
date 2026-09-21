/**
 * GET /api/usage – status ključa i potrošena mjesečna kvota.
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 */
import { handleError, ok } from "@/lib/api";
import { getUsage } from "@/lib/numista/client";

export async function GET() {
  try {
    return ok(await getUsage());
  } catch (e) {
    return handleError(e);
  }
}
