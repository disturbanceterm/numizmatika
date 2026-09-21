/**
 * GET /api/uploads/{file} – servira tvoju sliku iz data/uploads (izvan public/, pa ide kroz handler).
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 */
import { promises as fs } from "node:fs";
import path from "node:path";

import { fail } from "@/lib/api";
import { UPLOAD_DIR } from "@/lib/collection";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

type Ctx = { params: Promise<{ file: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const { file } = await params;
  // REASON: Dozvoljavamo samo golo ime fajla – nikakav "../" ne može izaći iz UPLOAD_DIR.
  const safe = path.basename(file);
  const type = MIME[path.extname(safe).toLowerCase()];
  if (!type || safe !== file) return fail("Nedozvoljen fajl.", 400);
  try {
    const data = await fs.readFile(path.join(UPLOAD_DIR, safe));
    return new Response(new Uint8Array(data), {
      headers: { "Content-Type": type, "Cache-Control": "private, max-age=31536000, immutable" },
    });
  } catch {
    return fail("Slika nije pronađena.", 404);
  }
}
