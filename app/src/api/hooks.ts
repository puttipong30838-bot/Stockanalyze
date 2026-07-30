import { useQuery } from "@tanstack/react-query";
import { api } from "./client";
import type { TradingMode } from "@/types/api";

export function useSymbols(params: { query?: string; market?: string; limit?: number } = {}) {
  return useQuery({
    queryKey: ["symbols", params],
    queryFn: () => api.symbols(params),
    staleTime: 5 * 60_000,
  });
}

export function useQuotes(symbols: string[], refetchIntervalMs = 20_000) {
  return useQuery({
    queryKey: ["quotes", symbols],
    queryFn: () => api.quotes(symbols),
    enabled: symbols.length > 0,
    refetchInterval: refetchIntervalMs,
  });
}

export function useChart(symbol: string, interval: string, range: string) {
  return useQuery({
    queryKey: ["chart", symbol, interval, range],
    queryFn: () => api.chart(symbol, interval, range),
    enabled: !!symbol,
    staleTime: 30_000,
  });
}

export function useAnalysis(symbol: string, mode: TradingMode, refetchIntervalMs = 60_000) {
  return useQuery({
    queryKey: ["analysis", symbol, mode],
    queryFn: () => api.analysis(symbol, mode),
    enabled: !!symbol,
    staleTime: 30_000,
    refetchInterval: refetchIntervalMs,
  });
}

export function useNews(params: { symbol?: string; lang?: string; limit?: number } = {}) {
  return useQuery({
    queryKey: ["news", params],
    queryFn: () => api.news(params),
    staleTime: 2 * 60_000,
  });
}

export function useMovers(params: { market?: string; type?: string } = {}) {
  return useQuery({
    queryKey: ["movers", params],
    queryFn: () => api.movers(params),
    refetchInterval: 20_000,
  });
}

export function useFx() {
  return useQuery({
    queryKey: ["fx"],
    queryFn: () => api.fx(),
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
  });
}

export function useCommunityPosts(
  params: { symbol?: string; userId?: number } = {},
  token?: string | null
) {
  return useQuery({
    queryKey: ["community-posts", params, token ?? null],
    queryFn: () => api.community.posts(params, token),
    refetchInterval: 30_000,
  });
}

export function useCommunityComments(postId: number) {
  return useQuery({
    queryKey: ["community-comments", postId],
    queryFn: () => api.community.comments(postId),
    enabled: !!postId,
  });
}

export function useCommunityProfile(userId: number, token?: string | null) {
  return useQuery({
    queryKey: ["community-profile", userId, token ?? null],
    queryFn: () => api.community.profile(userId, token),
    enabled: !!userId,
  });
}
