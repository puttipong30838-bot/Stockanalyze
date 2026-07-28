import type { SymbolInfo } from "../types/index.js";

// NASDAQ Trader publishes these pipe-delimited symbol directories for free,
// no key required, updated daily. nasdaqlisted.txt covers Nasdaq-listed
// issues; otherlisted.txt covers NYSE/NYSE American/other-exchange issues
// (its ticker column is "ACT Symbol" instead of "Symbol").
const NASDAQ_LISTED_URL = "https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqlisted.txt";
const OTHER_LISTED_URL = "https://www.nasdaqtrader.com/dynamic/SymDir/otherlisted.txt";

export interface RawDirectoryEntry {
  symbol: string;
  name: string;
}

/** Pure parser for either directory file's format -- no network involved,
 * so it's fully unit-testable against fixture text. */
export function parseSymbolDirectory(text: string): RawDirectoryEntry[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const header = lines[0].split("|").map((h) => h.trim());
  const symbolIdx =
    header.indexOf("ACT Symbol") !== -1 ? header.indexOf("ACT Symbol") : header.indexOf("Symbol");
  const nameIdx = header.indexOf("Security Name");
  const testIdx = header.indexOf("Test Issue");
  if (symbolIdx === -1 || nameIdx === -1) return [];

  const entries: RawDirectoryEntry[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("File Creation Time")) continue;
    const cols = line.split("|");
    if (cols.length <= Math.max(symbolIdx, nameIdx)) continue;
    const symbol = cols[symbolIdx]?.trim();
    const name = cols[nameIdx]?.trim();
    if (!symbol || !name) continue;
    if (testIdx !== -1 && cols[testIdx]?.trim() === "Y") continue;
    entries.push({ symbol, name });
  }
  return entries;
}

export async function fetchNasdaqSymbols(): Promise<SymbolInfo[]> {
  const [nasdaqText, otherText] = await Promise.all([
    fetch(NASDAQ_LISTED_URL).then((r) => r.text()),
    fetch(OTHER_LISTED_URL).then((r) => r.text()),
  ]);

  const combined = [...parseSymbolDirectory(nasdaqText), ...parseSymbolDirectory(otherText)];
  const seen = new Set<string>();
  const result: SymbolInfo[] = [];
  for (const entry of combined) {
    if (seen.has(entry.symbol)) continue;
    seen.add(entry.symbol);
    result.push({ symbol: entry.symbol, name: entry.name, market: "US" });
  }
  return result;
}
