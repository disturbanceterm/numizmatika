/**
 * Numista API v3 klijent: ključ u headeru `Numista-API-Key`, brojač mjesečne kvote u SQLite,
 * čekanje i ponavljanje na 429. Ako ključ nije postavljen, radi u "probnom" režimu
 * (ugrađeni katalog iz ./sample-catalog.ts) i ne troši nikakvu kvotu.
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 */
import "server-only";

import { prisma } from "@/lib/db";
import {
  sampleIssuers,
  sampleTypeDetail,
  sampleTypes,
  sampleIssues,
} from "./sample-catalog";
import type {
  NumistaIssue,
  NumistaIssuersResponse,
  NumistaTypeDetail,
  NumistaTypesResponse,
} from "./types";

export const NUMISTA_BASE_URL = "https://api.numista.com/v3";

export class NumistaError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code:
      | "no_key"
      | "quota_exhausted"
      | "rate_limited"
      | "not_found"
      | "http"
      | "network",
  ) {
    super(message);
    this.name = "NumistaError";
  }
}

export function getApiKey(): string | undefined {
  const key = process.env.NUMISTA_API_KEY?.trim();
  return key ? key : undefined;
}

/** true = nema ključa, koristi se ugrađeni probni katalog. */
export function isSampleMode(): boolean {
  return !getApiKey();
}

export function getMonthlyQuota(): number {
  const n = Number(process.env.NUMISTA_MONTHLY_QUOTA);
  return Number.isFinite(n) && n > 0 ? n : 2000;
}

export function getDetailBudget(): number {
  const n = Number(process.env.NUMISTA_DETAIL_BUDGET);
  return Number.isFinite(n) && n >= 0 ? n : 100;
}

export function currentMonthKey(date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function getUsage() {
  const month = currentMonthKey();
  const row = await prisma.apiUsage.findUnique({ where: { month } });
  const calls = row?.calls ?? 0;
  const quota = getMonthlyQuota();
  return {
    month,
    calls,
    quota,
    remaining: Math.max(0, quota - calls),
    sampleMode: isSampleMode(),
    detailBudget: getDetailBudget(),
  };
}

async function recordCall(): Promise<number> {
  const month = currentMonthKey();
  const row = await prisma.apiUsage.upsert({
    where: { month },
    create: { month, calls: 1 },
    update: { calls: { increment: 1 } },
  });
  return row.calls;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Params = Record<string, string | number | undefined>;

// REASON: 429 na Numisti znači ILI previše paralelnih zahtjeva ILI potrošena kvota; oba se
// tretiraju isto – čekaj (Retry-After ako postoji, inače eksponencijalno) i probaj ponovo.
// Poziv koji je odbijen sa 429 ne brojimo u kvotu jer ga Numista nije obradila.
const RETRY_DELAYS_MS = [2000, 5000, 12000];

async function request<T>(path: string, params: Params = {}): Promise<T> {
  const key = getApiKey();
  if (!key) {
    throw new NumistaError("NUMISTA_API_KEY nije postavljen.", 401, "no_key");
  }

  const usage = await getUsage();
  if (usage.remaining <= 0) {
    throw new NumistaError(
      `Mjesečna kvota (${usage.quota}) je potrošena.`,
      429,
      "quota_exhausted",
    );
  }

  const url = new URL(NUMISTA_BASE_URL + path);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }

  let lastError: NumistaError | undefined;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, {
        headers: { "Numista-API-Key": key, Accept: "application/json" },
        cache: "no-store",
      });
    } catch (e) {
      lastError = new NumistaError(
        `Mrežna greška: ${(e as Error).message}`,
        0,
        "network",
      );
      if (attempt < RETRY_DELAYS_MS.length) {
        await sleep(RETRY_DELAYS_MS[attempt]);
        continue;
      }
      throw lastError;
    }

    if (res.status === 429) {
      const retryAfter = Number(res.headers.get("retry-after"));
      const wait =
        Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)];
      lastError = new NumistaError(
        "Numista je vratila 429 (previše zahtjeva ili kvota).",
        429,
        "rate_limited",
      );
      if (attempt < RETRY_DELAYS_MS.length) {
        await sleep(wait);
        continue;
      }
      throw lastError;
    }

    await recordCall();

    if (res.status === 404) {
      throw new NumistaError("Nije pronađeno na Numisti.", 404, "not_found");
    }
    if (!res.ok) {
      let msg = `Numista HTTP ${res.status}`;
      try {
        const body = (await res.json()) as { error_message?: string };
        if (body.error_message) msg = body.error_message;
      } catch {
        /* tijelo nije JSON */
      }
      throw new NumistaError(msg, res.status, "http");
    }
    return (await res.json()) as T;
  }
  throw lastError ?? new NumistaError("Nepoznata greška.", 0, "http");
}

/* ------------------------------------------------------------------ */
/* Javni API (svaka funkcija ima probni režim)                          */
/* ------------------------------------------------------------------ */

export async function fetchIssuers(): Promise<NumistaIssuersResponse> {
  if (isSampleMode()) return sampleIssuers();
  return request<NumistaIssuersResponse>("/issuers", { lang: "en" });
}

export async function fetchTypesPage(
  issuerCode: string,
  page: number,
  count = 50,
): Promise<NumistaTypesResponse> {
  if (isSampleMode()) return sampleTypes(issuerCode, page, count);
  return request<NumistaTypesResponse>("/types", {
    issuer: issuerCode,
    page,
    count,
    lang: "en",
  });
}

export async function fetchTypeDetail(typeId: number): Promise<NumistaTypeDetail> {
  if (isSampleMode()) {
    const d = sampleTypeDetail(typeId);
    if (!d) throw new NumistaError("Nije u probnom katalogu.", 404, "not_found");
    return d;
  }
  return request<NumistaTypeDetail>(`/types/${typeId}`, { lang: "en" });
}

export async function fetchTypeIssues(typeId: number): Promise<NumistaIssue[]> {
  if (isSampleMode()) return sampleIssues(typeId);
  return request<NumistaIssue[]>(`/types/${typeId}/issues`, { lang: "en" });
}
