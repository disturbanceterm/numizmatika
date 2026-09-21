/**
 * GET /api/map/fill?year=1960 – popunjenost regiona za bojenje mape i bočni panel.
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 */
import { fail, handleError, intParam, ok } from "@/lib/api";
import { DEFAULT_MAP_YEAR, isMapYear } from "@/lib/map-years";
import { getMapFill } from "@/lib/map-fill";

export async function GET(request: Request) {
  try {
    const year = intParam(new URL(request.url).searchParams.get("year"), DEFAULT_MAP_YEAR)!;
    if (!isMapYear(year)) return fail("Nepoznata godina mape.", 400);
    return ok(await getMapFill(year));
  } catch (e) {
    return handleError(e);
  }
}
