/**
 * Ugrađeni probni katalog (koristi se kad NUMISTA_API_KEY nije postavljen).
 * Jugoslavija: novčanice i kovanice kroz sve faze (Kraljevina, FNRJ/SFRJ, SRJ), sa realnim
 * nazivima, godinama i valutama kakve vraća Numista. N# brojevi koji su poznati su pravi
 * (npr. 14908, 2000, 6942); ostali su rezervisani u opsegu 9 000 000+ i označeni `sample: true`.
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 */
import type {
  NumistaIssue,
  NumistaIssuersResponse,
  NumistaTypeDetail,
  NumistaTypeSummary,
  NumistaTypesResponse,
} from "./types";

export const SAMPLE_ISSUER_CODE = "yougoslavie";

const OBJ_BANKNOTE = { id: "2", name: "Standard banknotes" };
const OBJ_COIN = { id: "1", name: "Standard circulation coins" };
const OBJ_COMMEM = { id: "3", name: "Circulating commemorative coins" };

interface SampleType extends NumistaTypeDetail {
  sample: true;
}

let nextId = 9_000_001;
function id(real?: number) {
  return real ?? nextId++;
}

type Kind = "b" | "c" | "cc";

function mk(
  kind: Kind,
  title: string,
  minYear: number,
  maxYear: number,
  valueText: string,
  numeric: number,
  currency: { id: number; name: string; full_name: string },
  realId?: number,
  ruler?: string,
): SampleType {
  const object_type = kind === "b" ? OBJ_BANKNOTE : kind === "cc" ? OBJ_COMMEM : OBJ_COIN;
  return {
    sample: true,
    id: id(realId),
    title,
    object_type,
    issuer: { code: SAMPLE_ISSUER_CODE, name: "Yugoslavia" },
    min_year: minYear,
    max_year: maxYear,
    category: kind === "b" ? "banknote" : "coin",
    value: { text: valueText, numeric_value: numeric, currency },
    ruler: ruler ? [{ id: 0, name: ruler }] : undefined,
    demonetization: { is_demonetized: true },
    type: object_type.name,
  };
}

const DINAR_KRALJEVINA = { id: 9101, name: "Dinar", full_name: "Dinar (1920-1941)" };
const DINAR_FNRJ = { id: 9102, name: "Dinar", full_name: "Dinar (1944-1965)" };
const HARD_DINAR = { id: 9103, name: "Hard dinar", full_name: "Hard dinar (1966-1989)" };
const CONV_DINAR = { id: 9104, name: "Convertible dinar", full_name: "Convertible dinar (1990-1992)" };
const REF_DINAR = { id: 9105, name: "Reformed dinar", full_name: "Reformed dinar (1992-1993)" };
const OCT_DINAR = { id: 9106, name: "1994 dinar", full_name: "1994 dinar (1994)" };
const NOVI_DINAR = { id: 9107, name: "Novi dinar", full_name: "Novi dinar (1994-2003)" };

const KING_SHS = "Kingdom of Serbs, Croats and Slovenes (1918-1929)";
const KING_YU = "Kingdom of Yugoslavia (1929-1945)";
const FPRY = "Federal People's Republic (1945-1963)";
const SFRY = "Socialist Federal Republic (1963-1992)";
const FRY = "Federal Republic of Yugoslavia (1992-2003)";

const TYPES: SampleType[] = [
  // ---- Kraljevina SHS / Jugoslavija – Dinar (1920-1941) --------------------
  mk("c", "5 Para - Petar I", 1920, 1920, "5 Para", 0.05, DINAR_KRALJEVINA, 14908, KING_SHS),
  mk("c", "10 Para - Petar I", 1920, 1920, "10 Para", 0.1, DINAR_KRALJEVINA, 9933, KING_SHS),
  mk("c", "25 Para - Petar I", 1920, 1920, "25 Para", 0.25, DINAR_KRALJEVINA, 4864, KING_SHS),
  mk("c", "50 Para - Aleksandar I", 1925, 1925, "50 Para", 0.5, DINAR_KRALJEVINA, undefined, KING_SHS),
  mk("c", "1 Dinar - Aleksandar I", 1925, 1925, "1 Dinar", 1, DINAR_KRALJEVINA, undefined, KING_SHS),
  mk("c", "2 Dinara - Aleksandar I", 1925, 1925, "2 Dinara", 2, DINAR_KRALJEVINA, undefined, KING_SHS),
  mk("c", "10 Dinara - Aleksandar I", 1931, 1931, "10 Dinara", 10, DINAR_KRALJEVINA, undefined, KING_YU),
  mk("c", "20 Dinara - Aleksandar I", 1931, 1931, "20 Dinara", 20, DINAR_KRALJEVINA, undefined, KING_YU),
  mk("c", "50 Dinara - Aleksandar I", 1932, 1932, "50 Dinara", 50, DINAR_KRALJEVINA, undefined, KING_YU),
  mk("c", "25 Para - Petar II", 1938, 1938, "25 Para", 0.25, DINAR_KRALJEVINA, 7899, KING_YU),
  mk("c", "50 Para - Petar II", 1938, 1938, "50 Para", 0.5, DINAR_KRALJEVINA, undefined, KING_YU),
  mk("c", "1 Dinar - Petar II", 1938, 1938, "1 Dinar", 1, DINAR_KRALJEVINA, undefined, KING_YU),
  mk("c", "2 Dinara - Petar II", 1938, 1938, "2 Dinara", 2, DINAR_KRALJEVINA, undefined, KING_YU),
  mk("c", "10 Dinara - Petar II", 1938, 1938, "10 Dinara", 10, DINAR_KRALJEVINA, undefined, KING_YU),
  mk("c", "20 Dinara - Petar II", 1938, 1938, "20 Dinara", 20, DINAR_KRALJEVINA, undefined, KING_YU),
  mk("c", "50 Dinara - Petar II", 1938, 1938, "50 Dinara", 50, DINAR_KRALJEVINA, undefined, KING_YU),
  mk("b", "10 Dinara", 1920, 1920, "10 Dinara", 10, DINAR_KRALJEVINA, undefined, KING_SHS),
  mk("b", "100 Dinara", 1920, 1920, "100 Dinara", 100, DINAR_KRALJEVINA, undefined, KING_SHS),
  mk("b", "10 Dinara", 1926, 1926, "10 Dinara", 10, DINAR_KRALJEVINA, undefined, KING_SHS),
  mk("b", "100 Dinara", 1929, 1929, "100 Dinara", 100, DINAR_KRALJEVINA, undefined, KING_YU),
  mk("b", "50 Dinara", 1931, 1931, "50 Dinara", 50, DINAR_KRALJEVINA, undefined, KING_YU),
  mk("b", "1000 Dinara", 1931, 1931, "1000 Dinara", 1000, DINAR_KRALJEVINA, undefined, KING_YU),
  mk("b", "100 Dinara", 1934, 1934, "100 Dinara", 100, DINAR_KRALJEVINA, undefined, KING_YU),
  mk("b", "500 Dinara", 1935, 1935, "500 Dinara", 500, DINAR_KRALJEVINA, undefined, KING_YU),
  mk("b", "1000 Dinara", 1935, 1935, "1000 Dinara", 1000, DINAR_KRALJEVINA, undefined, KING_YU),
  mk("b", "20 Dinara", 1936, 1936, "20 Dinara", 20, DINAR_KRALJEVINA, undefined, KING_YU),
  mk("b", "10000 Dinara", 1936, 1936, "10000 Dinara", 10000, DINAR_KRALJEVINA, undefined, KING_YU),
  mk("b", "10 Dinara", 1939, 1939, "10 Dinara", 10, DINAR_KRALJEVINA, undefined, KING_YU),

  // ---- DFJ / FNRJ – Dinar (1944-1965) ---------------------------------------
  mk("b", "1 Dinar", 1944, 1944, "1 Dinar", 1, DINAR_FNRJ, undefined, FPRY),
  mk("b", "5 Dinara", 1944, 1944, "5 Dinara", 5, DINAR_FNRJ, undefined, FPRY),
  mk("b", "10 Dinara", 1944, 1944, "10 Dinara", 10, DINAR_FNRJ, undefined, FPRY),
  mk("b", "20 Dinara", 1944, 1944, "20 Dinara", 20, DINAR_FNRJ, undefined, FPRY),
  mk("b", "50 Dinara", 1944, 1944, "50 Dinara", 50, DINAR_FNRJ, undefined, FPRY),
  mk("b", "100 Dinara", 1944, 1944, "100 Dinara", 100, DINAR_FNRJ, undefined, FPRY),
  mk("b", "500 Dinara", 1944, 1944, "500 Dinara", 500, DINAR_FNRJ, undefined, FPRY),
  mk("b", "1000 Dinara", 1944, 1944, "1000 Dinara", 1000, DINAR_FNRJ, undefined, FPRY),
  mk("b", "50 Dinara", 1946, 1946, "50 Dinara", 50, DINAR_FNRJ, undefined, FPRY),
  mk("b", "100 Dinara", 1946, 1946, "100 Dinara", 100, DINAR_FNRJ, undefined, FPRY),
  mk("b", "500 Dinara", 1946, 1946, "500 Dinara", 500, DINAR_FNRJ, undefined, FPRY),
  mk("b", "1000 Dinara", 1946, 1946, "1000 Dinara", 1000, DINAR_FNRJ, undefined, FPRY),
  mk("b", "100 Dinara", 1953, 1953, "100 Dinara", 100, DINAR_FNRJ, undefined, FPRY),
  mk("b", "100 Dinara", 1955, 1955, "100 Dinara", 100, DINAR_FNRJ, undefined, FPRY),
  mk("b", "500 Dinara", 1955, 1955, "500 Dinara", 500, DINAR_FNRJ, undefined, FPRY),
  mk("b", "1000 Dinara", 1955, 1955, "1000 Dinara", 1000, DINAR_FNRJ, undefined, FPRY),
  mk("b", "5000 Dinara", 1955, 1955, "5000 Dinara", 5000, DINAR_FNRJ, undefined, FPRY),
  mk("c", "50 Para", 1945, 1945, "50 Para", 0.5, DINAR_FNRJ, undefined, FPRY),
  mk("c", "1 Dinar", 1945, 1945, "1 Dinar", 1, DINAR_FNRJ, undefined, FPRY),
  mk("c", "2 Dinara", 1945, 1945, "2 Dinara", 2, DINAR_FNRJ, undefined, FPRY),
  mk("c", "5 Dinara", 1945, 1945, "5 Dinara", 5, DINAR_FNRJ, undefined, FPRY),
  mk("c", "50 Para", 1953, 1953, "50 Para", 0.5, DINAR_FNRJ, undefined, FPRY),
  mk("c", "1 Dinar", 1953, 1953, "1 Dinar", 1, DINAR_FNRJ, undefined, FPRY),
  mk("c", "2 Dinara", 1953, 1953, "2 Dinara", 2, DINAR_FNRJ, undefined, FPRY),
  mk("c", "5 Dinara", 1953, 1953, "5 Dinara", 5, DINAR_FNRJ, undefined, FPRY),
  mk("c", "10 Dinara", 1955, 1963, "10 Dinara", 10, DINAR_FNRJ, undefined, FPRY),
  mk("c", "20 Dinara", 1955, 1963, "20 Dinara", 20, DINAR_FNRJ, undefined, FPRY),
  mk("c", "50 Dinara", 1955, 1963, "50 Dinara", 50, DINAR_FNRJ, undefined, FPRY),

  // ---- SFRJ – Hard dinar (1966-1989) ----------------------------------------
  mk("b", "100 Dinara", 1965, 1965, "100 Dinara", 100, HARD_DINAR, undefined, SFRY),
  mk("b", "5 Dinara", 1968, 1968, "5 Dinara", 5, HARD_DINAR, undefined, SFRY),
  mk("b", "10 Dinara", 1968, 1968, "10 Dinara", 10, HARD_DINAR, undefined, SFRY),
  mk("b", "50 Dinara", 1968, 1968, "50 Dinara", 50, HARD_DINAR, undefined, SFRY),
  mk("b", "500 Dinara", 1970, 1970, "500 Dinara", 500, HARD_DINAR, undefined, SFRY),
  mk("b", "20 Dinara", 1974, 1974, "20 Dinara", 20, HARD_DINAR, undefined, SFRY),
  mk("b", "1000 Dinara", 1974, 1974, "1000 Dinara", 1000, HARD_DINAR, undefined, SFRY),
  mk("b", "10 Dinara", 1978, 1981, "10 Dinara", 10, HARD_DINAR, undefined, SFRY),
  mk("b", "20 Dinara", 1978, 1981, "20 Dinara", 20, HARD_DINAR, undefined, SFRY),
  mk("b", "50 Dinara", 1978, 1981, "50 Dinara", 50, HARD_DINAR, undefined, SFRY),
  mk("b", "100 Dinara", 1978, 1986, "100 Dinara", 100, HARD_DINAR, undefined, SFRY),
  mk("b", "500 Dinara", 1978, 1986, "500 Dinara", 500, HARD_DINAR, undefined, SFRY),
  mk("b", "1000 Dinara", 1978, 1981, "1000 Dinara", 1000, HARD_DINAR, undefined, SFRY),
  mk("b", "5000 Dinara (Josip Broz Tito)", 1985, 1985, "5000 Dinara", 5000, HARD_DINAR, undefined, SFRY),
  mk("b", "20000 Dinara (Alija Sirotanović)", 1987, 1987, "20000 Dinara", 20000, HARD_DINAR, undefined, SFRY),
  mk("b", "50000 Dinara", 1988, 1988, "50000 Dinara", 50000, HARD_DINAR, undefined, SFRY),
  mk("b", "100000 Dinara", 1989, 1989, "100000 Dinara", 100000, HARD_DINAR, undefined, SFRY),
  mk("b", "500000 Dinara", 1989, 1989, "500000 Dinara", 500000, HARD_DINAR, undefined, SFRY),
  mk("b", "1000000 Dinara", 1989, 1989, "1000000 Dinara", 1000000, HARD_DINAR, undefined, SFRY),
  mk("b", "2000000 Dinara", 1989, 1989, "2000000 Dinara", 2000000, HARD_DINAR, undefined, SFRY),
  mk("c", "5 Para", 1965, 1965, "5 Para", 0.05, HARD_DINAR, undefined, SFRY),
  mk("c", "10 Para", 1965, 1965, "10 Para", 0.1, HARD_DINAR, undefined, SFRY),
  mk("c", "20 Para", 1965, 1965, "20 Para", 0.2, HARD_DINAR, undefined, SFRY),
  mk("c", "50 Para", 1965, 1965, "50 Para", 0.5, HARD_DINAR, undefined, SFRY),
  mk("c", "1 Dinar", 1965, 1965, "1 Dinar", 1, HARD_DINAR, undefined, SFRY),
  mk("c", "5 Para", 1975, 1981, "5 Para", 0.05, HARD_DINAR, undefined, SFRY),
  mk("c", "10 Para", 1977, 1981, "10 Para", 0.1, HARD_DINAR, undefined, SFRY),
  mk("c", "20 Para", 1978, 1981, "20 Para", 0.2, HARD_DINAR, undefined, SFRY),
  mk("c", "50 Para", 1978, 1981, "50 Para", 0.5, HARD_DINAR, undefined, SFRY),
  mk("c", "1 Dinar", 1973, 1981, "1 Dinar", 1, HARD_DINAR, 2000, SFRY),
  mk("c", "2 Dinara", 1971, 1981, "2 Dinara", 2, HARD_DINAR, undefined, SFRY),
  mk("c", "5 Dinara", 1971, 1981, "5 Dinara", 5, HARD_DINAR, undefined, SFRY),
  mk("c", "10 Dinara", 1976, 1981, "10 Dinara", 10, HARD_DINAR, undefined, SFRY),
  mk("cc", "10 Dinara (FAO)", 1976, 1976, "10 Dinara", 10, HARD_DINAR, undefined, SFRY),
  mk("c", "1 Dinar", 1982, 1986, "1 Dinar", 1, HARD_DINAR, undefined, SFRY),
  mk("c", "2 Dinara", 1982, 1986, "2 Dinara", 2, HARD_DINAR, undefined, SFRY),
  mk("c", "5 Dinara", 1982, 1986, "5 Dinara", 5, HARD_DINAR, undefined, SFRY),
  mk("c", "10 Dinara", 1982, 1988, "10 Dinara", 10, HARD_DINAR, undefined, SFRY),
  mk("c", "20 Dinara", 1985, 1987, "20 Dinara", 20, HARD_DINAR, undefined, SFRY),
  mk("c", "50 Dinara", 1985, 1988, "50 Dinara", 50, HARD_DINAR, undefined, SFRY),
  mk("c", "100 Dinara", 1985, 1988, "100 Dinara", 100, HARD_DINAR, undefined, SFRY),
  mk("cc", "100 Dinara (Zimske olimpijske igre Sarajevo 1984)", 1982, 1982, "100 Dinara", 100, HARD_DINAR, undefined, SFRY),

  // ---- SFRJ – Convertible dinar (1990-1992) ----------------------------------
  mk("b", "10 Dinara", 1990, 1990, "10 Dinara", 10, CONV_DINAR, undefined, SFRY),
  mk("b", "50 Dinara", 1990, 1990, "50 Dinara", 50, CONV_DINAR, undefined, SFRY),
  mk("b", "100 Dinara", 1990, 1991, "100 Dinara", 100, CONV_DINAR, undefined, SFRY),
  mk("b", "500 Dinara", 1990, 1991, "500 Dinara", 500, CONV_DINAR, undefined, SFRY),
  mk("b", "1000 Dinara", 1990, 1991, "1000 Dinara", 1000, CONV_DINAR, undefined, SFRY),
  mk("b", "5000 Dinara", 1991, 1991, "5000 Dinara", 5000, CONV_DINAR, undefined, SFRY),
  mk("c", "10 Para", 1990, 1991, "10 Para", 0.1, CONV_DINAR, undefined, SFRY),
  mk("c", "20 Para", 1990, 1991, "20 Para", 0.2, CONV_DINAR, undefined, SFRY),
  mk("c", "50 Para", 1990, 1991, "50 Para", 0.5, CONV_DINAR, undefined, SFRY),
  mk("c", "1 Dinar", 1990, 1991, "1 Dinar", 1, CONV_DINAR, undefined, SFRY),
  mk("c", "2 Dinara", 1990, 1992, "2 Dinara", 2, CONV_DINAR, undefined, SFRY),
  mk("c", "5 Dinara", 1990, 1992, "5 Dinara", 5, CONV_DINAR, undefined, SFRY),

  // ---- SRJ – Reformed dinar (1992-1993) --------------------------------------
  mk("b", "100 Dinara", 1992, 1992, "100 Dinara", 100, REF_DINAR, undefined, FRY),
  mk("b", "500 Dinara", 1992, 1992, "500 Dinara", 500, REF_DINAR, undefined, FRY),
  mk("b", "1000 Dinara", 1992, 1992, "1000 Dinara", 1000, REF_DINAR, undefined, FRY),
  mk("b", "5000 Dinara", 1992, 1992, "5000 Dinara", 5000, REF_DINAR, undefined, FRY),
  mk("b", "10000 Dinara", 1992, 1992, "10000 Dinara", 10000, REF_DINAR, undefined, FRY),
  mk("b", "50000 Dinara", 1992, 1992, "50000 Dinara", 50000, REF_DINAR, undefined, FRY),
  mk("b", "100000 Dinara", 1993, 1993, "100000 Dinara", 100000, REF_DINAR, undefined, FRY),
  mk("b", "1000000 Dinara", 1993, 1993, "1000000 Dinara", 1000000, REF_DINAR, undefined, FRY),
  mk("b", "10000000 Dinara", 1993, 1993, "10000000 Dinara", 10000000, REF_DINAR, undefined, FRY),
  mk("b", "500000000000 Dinara (Jovan Jovanović Zmaj)", 1993, 1993, "500 000 000 000 Dinara", 5e11, REF_DINAR, undefined, FRY),
  mk("c", "1 Dinar", 1992, 1992, "1 Dinar", 1, REF_DINAR, 6942, FRY),
  mk("c", "2 Dinara", 1992, 1992, "2 Dinara", 2, REF_DINAR, undefined, FRY),
  mk("c", "5 Dinara", 1992, 1992, "5 Dinara", 5, REF_DINAR, undefined, FRY),
  mk("c", "10 Dinara", 1992, 1992, "10 Dinara", 10, REF_DINAR, undefined, FRY),
  mk("c", "50 Dinara", 1992, 1992, "50 Dinara", 50, REF_DINAR, undefined, FRY),
  mk("c", "100 Dinara", 1993, 1993, "100 Dinara", 100, REF_DINAR, undefined, FRY),

  // ---- SRJ – 1994 dinar (januar 1994) ----------------------------------------
  mk("b", "10 Dinara", 1994, 1994, "10 Dinara", 10, OCT_DINAR, undefined, FRY),
  mk("b", "100 Dinara", 1994, 1994, "100 Dinara", 100, OCT_DINAR, undefined, FRY),
  mk("b", "1000 Dinara", 1994, 1994, "1000 Dinara", 1000, OCT_DINAR, undefined, FRY),

  // ---- SRJ – Novi dinar (1994-2003) ------------------------------------------
  mk("b", "1 Novi dinar", 1994, 1994, "1 Novi dinar", 1, NOVI_DINAR, undefined, FRY),
  mk("b", "5 Novih dinara", 1994, 1994, "5 Novih dinara", 5, NOVI_DINAR, undefined, FRY),
  mk("b", "10 Novih dinara", 1994, 1994, "10 Novih dinara", 10, NOVI_DINAR, undefined, FRY),
  mk("b", "20 Novih dinara", 1994, 1994, "20 Novih dinara", 20, NOVI_DINAR, undefined, FRY),
  mk("b", "50 Novih dinara", 1996, 1996, "50 Novih dinara", 50, NOVI_DINAR, undefined, FRY),
  mk("b", "100 Novih dinara", 1996, 1996, "100 Novih dinara", 100, NOVI_DINAR, undefined, FRY),
  mk("b", "20 Dinara", 2000, 2000, "20 Dinara", 20, NOVI_DINAR, undefined, FRY),
  mk("b", "50 Dinara", 2000, 2000, "50 Dinara", 50, NOVI_DINAR, undefined, FRY),
  mk("b", "100 Dinara", 2000, 2000, "100 Dinara", 100, NOVI_DINAR, undefined, FRY),
  mk("b", "200 Dinara", 2001, 2001, "200 Dinara", 200, NOVI_DINAR, undefined, FRY),
  mk("b", "1000 Dinara", 2001, 2001, "1000 Dinara", 1000, NOVI_DINAR, undefined, FRY),
  mk("c", "1 Para", 1994, 1995, "1 Para", 0.01, NOVI_DINAR, undefined, FRY),
  mk("c", "5 Para", 1994, 1995, "5 Para", 0.05, NOVI_DINAR, undefined, FRY),
  mk("c", "10 Para", 1994, 1995, "10 Para", 0.1, NOVI_DINAR, undefined, FRY),
  mk("c", "50 Para", 1994, 1995, "50 Para", 0.5, NOVI_DINAR, undefined, FRY),
  mk("c", "1 Novi dinar", 1994, 1995, "1 Novi dinar", 1, NOVI_DINAR, undefined, FRY),
  mk("c", "50 Para", 1996, 1999, "50 Para", 0.5, NOVI_DINAR, undefined, FRY),
  mk("c", "1 Novi dinar", 1996, 1999, "1 Novi dinar", 1, NOVI_DINAR, undefined, FRY),
  mk("c", "1 Dinar", 2000, 2002, "1 Dinar", 1, NOVI_DINAR, undefined, FRY),
  mk("c", "2 Dinara", 2000, 2002, "2 Dinara", 2, NOVI_DINAR, undefined, FRY),
  mk("c", "5 Dinara", 2000, 2002, "5 Dinara", 5, NOVI_DINAR, undefined, FRY),
];

const BY_ID = new Map<number, SampleType>(TYPES.map((t) => [t.id, t]));

export function sampleIssuers(): NumistaIssuersResponse {
  const section = { code: "yugoslavia_section", name: "Yugoslavia" };
  const issuers = [
    { code: "yugoslavia_section", name: "Yugoslavia", wikidata_id: "Q36704", level: 1 },
    {
      code: SAMPLE_ISSUER_CODE,
      name: "Yugoslavia",
      wikidata_id: "Q36704",
      parent: section,
      level: 2,
      flag: "https://en.numista.com/design/pays/yougoslavie.gif",
    },
    { code: "serbie", name: "Serbia", wikidata_id: "Q403", level: 2 },
    { code: "croatie", name: "Croatia", wikidata_id: "Q224", level: 2 },
    { code: "bosnie-herzegovine", name: "Bosnia and Herzegovina", wikidata_id: "Q225", level: 2 },
    { code: "montenegro", name: "Montenegro", wikidata_id: "Q236", level: 1 },
    { code: "slovenie", name: "Slovenia", wikidata_id: "Q215", level: 1 },
    { code: "macedoine", name: "North Macedonia", wikidata_id: "Q221", level: 2 },
    { code: "autriche-habsbourg", name: "Austrian Empire", wikidata_id: "Q131964", level: 2 },
    { code: "autriche", name: "Austria", wikidata_id: "Q40", level: 2 },
    { code: "ottoman", name: "Ottoman Empire", wikidata_id: "Q12560", level: 1 },
    { code: "turquie", name: "Turkey", wikidata_id: "Q43", level: 1 },
    { code: "italie", name: "Italy", wikidata_id: "Q38", level: 1 },
    { code: "ancienne_urss", name: "Soviet Union", wikidata_id: "Q15180", level: 2 },
    { code: "bulgarie", name: "Bulgaria", wikidata_id: "Q219", level: 1 },
    { code: "albanie", name: "Albania", wikidata_id: "Q222", level: 2 },
    { code: "pologne", name: "Poland", wikidata_id: "Q36", level: 1 },
  ];
  return { count: issuers.length, issuers };
}

function toSummary(t: SampleType): NumistaTypeSummary {
  return {
    id: t.id,
    title: t.title,
    object_type: t.object_type,
    issuer: t.issuer,
    min_year: t.min_year,
    max_year: t.max_year,
    category: t.category,
  };
}

export function sampleTypes(issuerCode: string, page: number, count: number): NumistaTypesResponse {
  if (issuerCode !== SAMPLE_ISSUER_CODE) return { count: 0, types: [] };
  const start = (page - 1) * count;
  return {
    count: TYPES.length,
    types: TYPES.slice(start, start + count).map(toSummary),
  };
}

export function sampleTypeDetail(typeId: number): NumistaTypeDetail | undefined {
  return BY_ID.get(typeId);
}

export function sampleIssues(typeId: number): NumistaIssue[] {
  const t = BY_ID.get(typeId);
  if (!t || t.min_year == null || t.max_year == null) return [];
  const issues: NumistaIssue[] = [];
  for (let y = t.min_year; y <= t.max_year; y++) {
    issues.push({ id: t.id * 100 + (y - t.min_year), is_dated: true, year: y, gregorian_year: y });
  }
  return issues;
}

export const SAMPLE_TYPE_COUNT = TYPES.length;
