/**
 * Gornja navigacija: Mapa · Kolekcija · Podešavanja + indikator kvote.
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 */
"use client";

import { Coins, Globe2, Settings2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { QuotaBadge } from "@/components/quota-badge";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Mapa", icon: Globe2 },
  { href: "/kolekcija", label: "Kolekcija", icon: Coins },
  { href: "/podesavanja", label: "Podešavanja", icon: Settings2 },
] as const;

export function SiteNav() {
  const pathname = usePathname();
  return (
    <header className="z-20 flex h-12 shrink-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur sm:px-4">
      <Link href="/" className="mr-2 flex items-center gap-2 font-semibold tracking-tight">
        <span className="inline-flex size-6 items-center justify-center rounded-full bg-amber-500 text-[11px] font-bold text-amber-950">
          N
        </span>
        <span className="hidden sm:inline">Numizmatika</span>
      </Link>
      <nav className="flex items-center gap-1">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors hover:bg-muted",
                active ? "bg-muted text-foreground" : "text-muted-foreground",
              )}
            >
              <Icon className="size-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="ml-auto">
        <QuotaBadge />
      </div>
    </header>
  );
}
