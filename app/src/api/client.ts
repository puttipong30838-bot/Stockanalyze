import { API_BASE_URL } from "./config";
import type {
  AnalysisBundle,
  ApiEnvelope,
  AuthResponse,
  AuthUser,
  ChartResponse,
  FxRate,
  NewsArticle,
  Quote,
  SymbolInfo,
  TradingMode,
  UserSettingsPayload,
} from "@/types/api";

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string | null } = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  const body = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok) {
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return body.data;
}

function getJson<T>(path: string): Promise<T> {
  return request<T>(path);
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

  fx: () => getJson<FxRate>("/api/v1/fx"),

  auth: {
    register: (email: string, password: string, displayName?: string) =>
      request<AuthResponse>("/api/v1/auth/register", {
        method: "POST",
        body: { email, password, displayName },
      }),
    login: (email: string, password: string) =>
      request<AuthResponse>("/api/v1/auth/login", { method: "POST", body: { email, password } }),
    me: (token: string) => request<AuthUser>("/api/v1/auth/me", { token }),
  },

  userWatchlist: {
    get: (token: string) => request<string[]>("/api/v1/user/watchlist", { token }),
    set: (token: string, symbols: string[]) =>
      request<string[]>("/api/v1/user/watchlist", { method: "PUT", token, body: { symbols } }),
  },

  userSettings: {
    get: (token: string) => request<UserSettingsPayload>("/api/v1/user/settings", { token }),
    set: (token: string, settings: UserSettingsPayload) =>
      request<UserSettingsPayload>("/api/v1/user/settings", { method: "PUT", token, body: settings }),
  },
};
