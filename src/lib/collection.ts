/**
 * Kolekcija: dodavanje/brisanje komada, čuvanje slika u data/uploads, lista i statistika.
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 */
import "server-only";

import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import { prisma } from "@/lib/db";

export const GRADES = ["UNC", "AU", "XF", "VF", "F", "VG", "G", "P"] as const;
export type Grade = (typeof GRADES)[number];

export const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
]);

export async function saveUpload(file: File): Promise<string> {
  const ext = ALLOWED_IMAGE.get(file.type);
  if (!ext) throw new Error("Dozvoljene su samo JPEG, PNG, WebP i GIF slike.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Slika je veća od 10 MB.");
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  // REASON: Nasumično ime umjesto originalnog – bez sudara i bez path-traversal rizika.
  const name = `${randomUUID()}${ext}`;
  await fs.writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return name;
}

export function uploadUrl(imagePath: string | null): string | null {
  return imagePath ? `/api/uploads/${encodeURIComponent(imagePath)}` : null;
}

export interface NewItemInput {
  typeId: number;
  year?: number | null;
  grade?: string | null;
  quantity?: number;
  price?: number | null;
  note?: string | null;
  imagePath?: string | null;
}

export async function addItem(input: NewItemInput) {
  const type = await prisma.catalogType.findUnique({ where: { id: input.typeId } });
  if (!type) throw new Error("Tip iz kataloga ne postoji – učitaj katalog prvo.");
  if (input.grade && !(GRADES as readonly string[]).includes(input.grade)) {
    throw new Error("Nepoznato stanje.");
  }
  return prisma.collectionItem.create({
    data: {
      typeId: input.typeId,
      year: input.year ?? null,
      grade: input.grade ?? null,
      quantity: input.quantity && input.quantity > 0 ? input.quantity : 1,
      price: input.price ?? null,
      note: input.note?.trim() || null,
      imagePath: input.imagePath ?? null,
    },
  });
}

export async function deleteItem(id: number) {
  const item = await prisma.collectionItem.delete({ where: { id } });
  if (item.imagePath) {
    // REASON: Slika se ne briše nego arhivira (mandat "sačuvaj pa obriši").
    const from = path.join(UPLOAD_DIR, item.imagePath);
    await fs.rename(from, `${from}.archive`).catch(() => undefined);
  }
  return item;
}

export async function listItems(q?: string) {
  const term = q?.trim();
  return prisma.collectionItem.findMany({
    where: term
      ? {
          OR: [
            { type: { title: { contains: term } } },
            { type: { currencyName: { contains: term } } },
            { type: { issuer: { name: { contains: term } } } },
            { note: { contains: term } },
            { grade: { contains: term } },
          ],
        }
      : undefined,
    include: { type: { include: { issuer: true } } },
    orderBy: [{ createdAt: "desc" }],
  });
}

export interface CollectionStats {
  items: number;
  pieces: number;
  types: number;
  issuers: number;
  banknotes: number;
  coins: number;
  /** Popunjenost po učitanim katalozima: posjedovani tipovi / svi tipovi. */
  catalogTotal: number;
  catalogOwned: number;
  perIssuer: { code: string; name: string; owned: number; total: number }[];
}

export async function getCollectionStats(): Promise<CollectionStats> {
  const items = await prisma.collectionItem.findMany({
    include: { type: { select: { id: true, issuerCode: true, category: true } } },
  });
  const typeIds = new Set(items.map((i) => i.typeId));
  const issuerCodes = new Set(items.map((i) => i.type.issuerCode));
  const ownedTypes = await prisma.catalogType.findMany({
    where: { id: { in: [...typeIds] } },
    select: { category: true, issuerCode: true },
  });

  const loadedIssuers = await prisma.issuer.findMany({
    where: { catalogSyncedAt: { not: null } },
    select: { code: true, name: true, _count: { select: { types: true } } },
  });
  const ownedByIssuer = new Map<string, number>();
  for (const t of ownedTypes) ownedByIssuer.set(t.issuerCode, (ownedByIssuer.get(t.issuerCode) ?? 0) + 1);

  const perIssuer = loadedIssuers
    .map((i) => ({ code: i.code, name: i.name, owned: ownedByIssuer.get(i.code) ?? 0, total: i._count.types }))
    .sort((a, b) => b.owned - a.owned || a.name.localeCompare(b.name));

  return {
    items: items.length,
    pieces: items.reduce((s, i) => s + i.quantity, 0),
    types: typeIds.size,
    issuers: issuerCodes.size,
    banknotes: ownedTypes.filter((t) => t.category === "banknote").length,
    coins: ownedTypes.filter((t) => t.category === "coin").length,
    catalogTotal: perIssuer.reduce((s, i) => s + i.total, 0),
    catalogOwned: perIssuer.reduce((s, i) => s + i.owned, 0),
    perIssuer,
  };
}
