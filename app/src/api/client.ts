import { API_BASE_URL } from "./config";
import type {
  AnalysisBundle,
  ApiEnvelope,
  ChartResponse,
  NewsArticle,
  Quote,
  SymbolInfo,
  TradingMode,
} from "@/types/api";

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`);
  const body = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok) {
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return body.data;
}

export const api = {
  symbols: (params: { query?: string; market?: string; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.query) qs.set("query", params.query);
    if (params.market) qs.set("market", params.market);
    if (params.limit) qs.set("limit", String(params.limit));
    return getJson<SymbolInfo[]>(`/api/v1/symbols?${qs.toString()}`);
  },

  quotes: (symbols: string[]) =>
    getJson<Quote[]>(`/api/v1/quotes?symbols=${encodeURIComponent(symbols.join(","))}`),

  chart: (symbol: string, interval: string, range: string) =>
    getJson<ChartResponse>(
      `/api/v1/charts/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`
    ),

  analysis: (symbol: string, mode: TradingMode) =>
    getJson<AnalysisBundle>(`/api/v1/analysis/${encodeURIComponent(symbol)}?mode=${mode}`),

  news: (params: { symbol?: string; lang?: string; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.symbol) qs.set("symbol", params.symbol);
    if (params.lang) qs.set("lang", params.lang);
    if (params.limit) qs.set("limit", String(params.limit));
    return getJson<{ articles: NewsArticle[] }>(`/api/v1/news?${qs.toString()}`);
  },

  movers: (params: { market?: string; type?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.market) qs.set("market", params.market);
    if (params.type) qs.set("type", params.type);
    return getJson<Quote[]>(`/api/v1/movers?${qs.toString()}`);
  },
};
