/**
 * Mali indikator u navigaciji: probni režim ili potrošena Numista kvota ovog mjeseca.
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface UsageInfo {
  month: string;
  calls: number;
  quota: number;
  remaining: number;
  sampleMode: boolean;
  detailBudget: number;
}

export function useUsage(refreshKey?: unknown) {
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/usage")
      .then((r) => (r.ok ? r.json() : null))
      .then((u: UsageInfo | null) => {
        if (!cancelled) setUsage(u);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);
  return usage;
}

export function QuotaBadge() {
  const usage = useUsage();
  if (!usage) return null;

  if (usage.sampleMode) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href="/podesavanja">
            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-900">
              Probni katalog
            </Badge>
          </Link>
        </TooltipTrigger>
        <TooltipContent>NUMISTA_API_KEY nije postavljen – koristi se ugrađeni katalog Jugoslavije.</TooltipContent>
      </Tooltip>
    );
  }

  const pct = usage.quota > 0 ? Math.round((usage.calls / usage.quota) * 100) : 0;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link href="/podesavanja">
          <Badge variant={pct >= 90 ? "destructive" : "secondary"} className="font-mono">
            Numista {usage.calls}/{usage.quota}
          </Badge>
        </Link>
      </TooltipTrigger>
      <TooltipContent>Potrošeno API poziva u {usage.month}. Preostalo: {usage.remaining}.</TooltipContent>
    </Tooltip>
  );
}
