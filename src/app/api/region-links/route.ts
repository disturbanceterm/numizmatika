/**
 * GET  /api/region-links – sve veze region -> izdavač.
 * POST /api/region-links { regionName, issuerCode, yearFrom?, yearTo? } – nova veza.
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 */
import { fail, handleError, ok } from "@/lib/api";
import { prisma } from "@/lib/db";
import { createLink, getAllLinks } from "@/lib/region-links";

export async function GET() {
  try {
    return ok({ links: await getAllLinks() });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      regionName?: string;
      issuerCode?: string;
      yearFrom?: number | null;
      yearTo?: number | null;
    };
    if (!body.regionName?.trim() || !body.issuerCode?.trim()) {
      return fail("Potrebni su regionName i issuerCode.", 400);
    }
    const issuer = await prisma.issuer.findUnique({ where: { code: body.issuerCode } });
    if (!issuer) return fail("Izdavač ne postoji u kešu – prvo pretraži izdavače.", 404);
    const link = await createLink({
      regionName: body.regionName,
      issuerCode: body.issuerCode,
      yearFrom: body.yearFrom ?? null,
      yearTo: body.yearTo ?? null,
    });
    return ok({ link }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
