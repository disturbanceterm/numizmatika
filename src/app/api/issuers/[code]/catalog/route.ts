/**
 * GET  /api/issuers/{code}/catalog – album (tipovi grupisani po valuti/periodu + tvoji komadi).
 * POST /api/issuers/{code}/catalog – "Učitaj katalog sa Numiste" (1 poziv na 50 komada).
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 */
import { fail, handleError, ok } from "@/lib/api";
import { getAlbum, loadCatalog } from "@/lib/catalog";
import { getUsage } from "@/lib/numista/client";

type Ctx = { params: Promise<{ code: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const { code } = await params;
    const album = await getAlbum(code);
    if (!album) return fail("Izdavač nije pronađen.", 404);
    return ok(album);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(_request: Request, { params }: Ctx) {
  try {
    const { code } = await params;
    const result = await loadCatalog(code);
    return ok({ ...result, usage: await getUsage() });
  } catch (e) {
    return handleError(e);
  }
}
