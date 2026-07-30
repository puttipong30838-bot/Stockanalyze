import type { SymbolInfo } from "../types/index.js";

/**
 * BEST-EFFORT / UNVERIFIED PROVIDER.
 *
 * Unlike NASDAQ Trader's decades-stable plain-text symbol directory
 * (nasdaq.ts), there is no equivalent long-standing public bulk file for the
 * full SET-listed universe, and this sandbox's outbound network policy
 * blocks set.or.th entirely, so the URL and response shape below could not
 * be verified against the live site before shipping. This is expected to
 * possibly need a follow-up fix once it's actually run with real internet
 * access -- that's the accepted tradeoff for attempting it at all, not a
 * sign something was done carelessly. Everything SET-specific is isolated
 * to this one file (mirroring how yahoo.ts and nasdaq.ts isolate their own
 * upstream quirks), so fixing the shape later is a single-file change, and
 * the caller (routes/symbols.ts) already falls back to the curated seed
 * list on any failure here.
 */
const SET_STOCK_LIST_URL = "https://www.set.or.th/api/set/stock/list?lang=en";

interface RawSetEntry {
  symbol?: string;
  name?: string;
  nameEN?: string;
  nameTH?: string;
}

/** Pure parser, network-free and fixture-testable. Accepts a few plausible
 * top-level JSON shapes (a bare array, or an array nested under a common
 * field name) since the real response shape is unverified. */
export function parseSetStockList(json: unknown): SymbolInfo[] {
  const entries = extractEntryArray(json);
  const seen = new Set<string>();
  const result: SymbolInfo[] = [];
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as RawSetEntry;
    const symbol = e.symbol?.trim();
    const name = (e.nameEN ?? e.name ?? e.nameTH)?.trim();
    if (!symbol || !name || seen.has(symbol)) continue;
    seen.add(symbol);
    // Yahoo Finance (this app's quote/chart provider) addresses SET tickers
    // with a ".BK" suffix -- match the curated seed list's convention.
    result.push({ symbol: `${symbol}.BK`, name, market: "SET" });
  }
  return result;
}

function extractEntryArray(json: unknown): unknown[] {
  if (Array.isArray(json)) return json;
  if (json && typeof json === "object") {
    for (const key of ["securitySymbols", "stockList", "list", "data", "results"]) {
      const value = (json as Record<string, unknown>)[key];
      if (Array.isArray(value)) return value;
    }
  }
  return [];
}

export async function fetchSetSymbols(): Promise<SymbolInfo[]> {
  const res = await fetch(SET_STOCK_LIST_URL);
  if (!res.ok) {
    throw new Error(`SET stock list request failed with status ${res.status}`);
  }
  const json = await res.json();
  return parseSetStockList(json);
}
