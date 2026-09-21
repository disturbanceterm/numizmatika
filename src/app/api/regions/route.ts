/**
 * GET /api/regions?unlinked=1 – regioni sa svih mapa (ime + godine), opciono samo nepovezani.
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 */
import { handleError, ok } from "@/lib/api";
import { getAllMapRegions, getUnlinkedRegions } from "@/lib/region-links";

export async function GET(request: Request) {
  try {
    const unlinked = new URL(request.url).searchParams.get("unlinked") === "1";
    const regions = unlinked ? await getUnlinkedRegions() : await getAllMapRegions();
    return ok({ regions });
  } catch (e) {
    return handleError(e);
  }
}
