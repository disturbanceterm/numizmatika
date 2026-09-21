/**
 * DELETE /api/region-links/{id} – ukloni vezu region -> izdavač.
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 */
import { fail, handleError, ok } from "@/lib/api";
import { deleteLink } from "@/lib/region-links";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const id = Number((await params).id);
    if (!Number.isInteger(id)) return fail("Neispravan ID.", 400);
    await deleteLink(id);
    return ok({ deleted: id });
  } catch (e) {
    return handleError(e);
  }
}
