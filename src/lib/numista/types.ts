/**
 * Tipovi Numista API-ja v3 (samo polja koja koristimo; vidi OpenAPI spec 3.31.1).
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 */

export interface NumistaIssuerRef {
  code: string;
  name: string;
}

export interface NumistaIssuer extends NumistaIssuerRef {
  flag?: string;
  wikidata_id?: string;
  parent?: NumistaIssuerRef;
  level?: number;
}

export interface NumistaIssuersResponse {
  count: number;
  issuers: NumistaIssuer[];
}

export interface NumistaObjectType {
  id: string | number;
  name: string;
}

export interface NumistaTypeSummary {
  id: number;
  title: string;
  object_type?: NumistaObjectType;
  issuer?: NumistaIssuerRef;
  min_year?: number;
  max_year?: number;
  obverse_thumbnail?: string;
  reverse_thumbnail?: string;
  /** @deprecated Numista ga označava kao zastarjelo, ali i dalje stiže. */
  category?: "coin" | "banknote" | "exonumia";
}

export interface NumistaTypesResponse {
  count: number;
  types: NumistaTypeSummary[];
}

export interface NumistaCurrency {
  id: number;
  name: string;
  full_name: string;
}

export interface NumistaTypeDetail extends NumistaTypeSummary {
  url?: string;
  value?: {
    text?: string;
    numeric_value?: number;
    numerator?: number;
    denominator?: number;
    currency?: NumistaCurrency;
  };
  ruler?: { id: number; name: string; wikidata_id?: string }[];
  demonetization?: { is_demonetized: boolean; demonetization_date?: string };
  obverse?: { description?: string; picture?: string; thumbnail?: string };
  reverse?: { description?: string; picture?: string; thumbnail?: string };
  size?: number;
  weight?: number;
  composition?: { text?: string };
  type?: string;
}

export interface NumistaIssue {
  id: number;
  is_dated?: boolean;
  year?: number;
  gregorian_year?: number;
  min_year?: number;
  max_year?: number;
  mint_letter?: string;
  mintage?: number;
  comment?: string;
}

/** Kategorija koju koristimo interno (izvedena iz object_type.name). */
export type Category = "banknote" | "coin" | "exonumia";

export function categoryFromObjectType(
  objectTypeName: string | undefined,
  fallback: NumistaTypeSummary["category"],
): Category {
  const n = (objectTypeName ?? "").toLowerCase();
  if (n.includes("banknote")) return "banknote";
  if (n.includes("coin")) return "coin";
  if (fallback === "banknote" || fallback === "coin") return fallback;
  return "exonumia";
}
