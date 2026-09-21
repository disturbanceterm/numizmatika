/**
 * Korijenski layout: fontovi, navigacija, TooltipProvider.
 *
 * @changelog
 * 2026-09-21  Početna verzija (naš jezik, latinica).
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SiteNav } from "@/components/site-nav";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: {
    default: "Numizmatika",
    template: "%s · Numizmatika",
  },
  description: "Istorijska mapa svijeta i album tvoje numizmatičke kolekcije (Numista katalog).",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="bs" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex h-full min-h-screen flex-col bg-background text-foreground">
        <TooltipProvider>
          <SiteNav />
          <main className="flex min-h-0 flex-1 flex-col">{children}</main>
        </TooltipProvider>
      </body>
    </html>
  );
}
