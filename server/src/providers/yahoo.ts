import YahooFinance from "yahoo-finance2";
import type { Candle, Quote } from "../types/index.js";

const yahooFinance = new YahooFinance();

export type ChartInterval = "1m" | "5m" | "15m" | "1h" | "1d" | "1wk";
export type ChartRange = "1d" | "5d" | "1mo" | "6mo" | "ytd" | "1y" | "5y";

const INTERVAL_MAP: Record<ChartInterval, string> = {
  "1m": "1m",
  "5m": "5m",
  "15m": "15m",
  "1h": "60m",
  "1d": "1d",
  "1wk": "1wk",
};

export function rangeToDates(range: ChartRange): { period1: Date; period2: Date } {
  const period2 = new Date();
  const period1 = new Date(period2);
  switch (range) {
    case "1d":
      period1.setDate(period1.getDate() - 1);
      break;
    case "5d":
      period1.setDate(period1.getDate() - 5);
      break;
    case "1mo":
      period1.setMonth(period1.getMonth() - 1);
      break;
    case "6mo":
      period1.setMonth(period1.getMonth() - 6);
      break;
    case "ytd":
      period1.setMonth(0, 1);
      period1.setHours(0, 0, 0, 0);
      break;
    case "1y":
      period1.setFullYear(period1.getFullYear() - 1);
      break;
    case "5y":
      period1.setFullYear(period1.getFullYear() - 5);
      break;
  }
  return { period1, period2 };
}

export async function fetchChart(
  symbol: string,
  interval: ChartInterval,
  range: ChartRange
): Promise<Candle[]> {
  const { period1, period2 } = rangeToDates(range);
  const result = await yahooFinance.chart(symbol, {
    period1,
    period2,
    interval: INTERVAL_MAP[interval] as any,
  });

  const quotes = result.quotes ?? [];
  const candles: Candle[] = [];
  for (const q of quotes) {
    if (
      q.open == null ||
      q.high == null ||
      q.low == null ||
      q.close == null
    ) {
      continue;
    }
    candles.push({
      t: Math.floor(new Date(q.date).getTime() / 1000),
      o: q.open,
      h: q.high,
      l: q.low,
      c: q.close,
      v: q.volume ?? 0,
    });
  }
  return candles;
}

export async function fetchQuotes(symbols: string[]): Promise<Quote[]> {
  if (symbols.length === 0) return [];
  const results = await yahooFinance.quote(symbols);
  const arr = Array.isArray(results) ? results : [results];
  return arr.map((r) => ({
    symbol: r.symbol,
    shortName: r.shortName,
    price: r.regularMarketPrice ?? null,
    change: r.regularMarketChange ?? null,
    changePercent: r.regularMarketChangePercent ?? null,
    dayHigh: r.regularMarketDayHigh ?? null,
    dayLow: r.regularMarketDayLow ?? null,
    prevClose: r.regularMarketPreviousClose ?? null,
    volume: r.regularMarketVolume ?? null,
    currency: r.currency,
    marketState: r.marketState,
    fiftyTwoWeekLow: r.fiftyTwoWeekLow ?? null,
    fiftyTwoWeekHigh: r.fiftyTwoWeekHigh ?? null,
    marketCap: r.marketCap ?? null,
  }));
}

export async function fetchExchangeRate(pair: string): Promise<number | null> {
  const quote = await yahooFinance.quote(pair);
  const arr = Array.isArray(quote) ? quote : [quote];
  return arr[0]?.regularMarketPrice ?? null;
}

export async function searchSymbols(query: string) {
  const result = await yahooFinance.search(query);
  return (result.quotes ?? [])
    .filter((q: any) => q.symbol)
    .map((q: any) => ({
      symbol: q.symbol as string,
      name: (q.shortname ?? q.longname ?? q.symbol) as string,
      exchange: q.exchange as string | undefined,
    }));
}
