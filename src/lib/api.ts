/**
 * Pomoćne funkcije za Route Handler-e: ujednačen JSON odgovor i mapiranje grešaka.
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 */
import "server-only";

import { NextResponse } from "next/server";

import { NumistaError } from "@/lib/numista/client";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/** Pretvara bačenu grešku u HTTP odgovor sa razumljivom porukom (Numista greške zadržavaju status). */
export function handleError(e: unknown) {
  if (e instanceof NumistaError) {
    const status = e.code === "no_key" ? 503 : e.status >= 400 && e.status < 600 ? e.status : 502;
    return fail(e.message, status, { code: e.code });
  }
  const message = e instanceof Error ? e.message : "Nepoznata greška.";
  console.error("[api]", e);
  return fail(message, 500);
}

export function intParam(value: string | null | undefined, fallback?: number): number | undefined {
  if (value == null || value === "") return fallback;
  const n = Number(value);
  return Number.isInteger(n) ? n : fallback;
}
