/**
 * GET /api/types/{id}/issues – godine/izdanja jednog tipa (1 Numista poziv), za izbor godine pri dodavanju.
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 */
import { fail, handleError, ok } from "@/lib/api";
import { fetchTypeIssues } from "@/lib/numista/client";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const id = Number((await params).id);
    if (!Number.isInteger(id)) return fail("Neispravan ID.", 400);
    const issues = await fetchTypeIssues(id);
    const years = [...new Set(issues.map((i) => i.gregorian_year ?? i.year).filter((y): y is number => y != null))].sort();
    return ok({ issues, years });
  } catch (e) {
    return handleError(e);
  }
}
