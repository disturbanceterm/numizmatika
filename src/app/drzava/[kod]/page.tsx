/**
 * Album jednog izdavača: /drzava/[kod] (kod = Numista issuer code, npr. "yougoslavie").
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 */
import type { Metadata } from "next";
import Link from "next/link";

import { AlbumView } from "@/components/album/album-view";
import { Button } from "@/components/ui/button";
import { getAlbum } from "@/lib/catalog";
import { getUsage } from "@/lib/numista/client";
import { ensureRegionLinksSeeded } from "@/lib/region-links";
import { prisma } from "@/lib/db";

export async function generateMetadata({ params }: PageProps<"/drzava/[kod]">): Promise<Metadata> {
  const { kod } = await params;
  const issuer = await prisma.issuer.findUnique({ where: { code: decodeURIComponent(kod) } });
  return { title: issuer ? `Album · ${issuer.name}` : "Album" };
}

export default async function IssuerAlbumPage({ params }: PageProps<"/drzava/[kod]">) {
  const { kod } = await params;
  const code = decodeURIComponent(kod);
  // REASON: Sijanje veza kreira placeholder izdavače – zovemo ga da album radi i na svježoj bazi.
  await ensureRegionLinksSeeded();
  const [album, usage] = await Promise.all([getAlbum(code), getUsage()]);

  if (!album) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 p-10 text-center">
        <h1 className="text-xl font-semibold">Nepoznat izdavač „{code}“</h1>
        <p className="text-sm text-muted-foreground">
          Ovaj kod ne postoji u lokalnom kešu izdavača. Poveži region sa izdavačem u podešavanjima ili se vrati na mapu.
        </p>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/">Mapa</Link>
          </Button>
          <Button asChild>
            <Link href="/podesavanja">Podešavanja</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <AlbumView initial={album} usage={usage} />;
}
