/**
 * GET  /api/collection?q= – lista tvojih komada.
 * POST /api/collection (multipart/form-data) – dodaj komad: typeId, year, grade, quantity, price, note, image.
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 */
import { fail, handleError, ok } from "@/lib/api";
import { addItem, listItems, saveUpload } from "@/lib/collection";

export async function GET(request: Request) {
  try {
    const q = new URL(request.url).searchParams.get("q") ?? undefined;
    return ok({ items: await listItems(q) });
  } catch (e) {
    return handleError(e);
  }
}

function num(v: FormDataEntryValue | null): number | null {
  if (typeof v !== "string" || v.trim() === "") return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const typeId = num(form.get("typeId"));
    if (typeId == null) return fail("Nedostaje typeId.", 400);

    const image = form.get("image");
    let imagePath: string | null = null;
    if (image instanceof File && image.size > 0) {
      imagePath = await saveUpload(image);
    }

    const item = await addItem({
      typeId,
      year: num(form.get("year")),
      grade: typeof form.get("grade") === "string" && form.get("grade") !== "" ? String(form.get("grade")) : null,
      quantity: num(form.get("quantity")) ?? 1,
      price: num(form.get("price")),
      note: typeof form.get("note") === "string" ? String(form.get("note")) : null,
      imagePath,
    });
    return ok({ item }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
