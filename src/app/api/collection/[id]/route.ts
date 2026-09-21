/**
 * DELETE /api/collection/{id} – ukloni komad iz kolekcije (slika se arhivira, ne briše).
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 */
import { fail, handleError, ok } from "@/lib/api";
import { deleteItem } from "@/lib/collection";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const id = Number((await params).id);
    if (!Number.isInteger(id)) return fail("Neispravan ID.", 400);
    await deleteItem(id);
    return ok({ deleted: id });
  } catch (e) {
    return handleError(e);
  }
}
