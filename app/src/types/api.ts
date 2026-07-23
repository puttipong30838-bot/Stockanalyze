export type Market = "SET" | "US";

export interface SymbolInfo {
  symbol: string;
  name: string;
  market: Market;
  sector?: string;
}

export interface Candle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface Quote {
  symbol: string;
  shortName?: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  prevClose: number | null;
  volume: number | null;
  currency?: string;
  marketState?: string;
}

export interface OverlaySeries {
  sma20: (number | null)[];
  sma50: (number | null)[];
  ema20: (number | null)[];
  bollinger: {
    upper: (number | null)[];
    middle: (number | null)[];
    lower: (number | null)[];
  };
}

export interface ChartResponse {
  candles: Candle[];
  overlays: OverlaySeries;
}

export type TrendDirection = "up" | "down" | "sideways";
export type VolatilityLevel = "low" | "medium" | "high";
export type FlagLabel = "bullish" | "bearish" | "neutral";
export type SentimentLabel = "positive" | "neutral" | "negative";
export type HoldLabel = "buy" | "hold" | "reduce" | "watch";
export type TradingMode = "investor" | "trader";

export interface ConsolidationZone {
  startIndex: number;
  endIndex: number;
  low: number;
  high: number;
}

export interface DetectedPattern {
  name: string;
  confidence: number;
  startIndex: number;
  endIndex: number;
}

export interface AnalysisBundle {
  symbol: string;
  mode: TradingMode;
  trend: { direction: TrendDirection; confidence: number };
  volatility: { level: VolatilityLevel; realizedVolPct: number; percentileRank: number };
  volume: { relativeVolume: number; callout: "above_average" | "below_average" | "spike" | "normal" };
  institutionalDemand: { score: number; flag: FlagLabel; methodology: "heuristic" };
  consolidation: { flag: "neutral" | null; zones: ConsolidationZone[] };
  detectedPatterns: DetectedPattern[];
  sentiment: { score: number; label: SentimentLabel };
  aiPlan: { text: string; styleMode: TradingMode };
  holdRecommendation: { label: HoldLabel; rationale: string };
  summary: string;
  detailedAnalysis: string;
  methodology: "heuristic-derived-from-public-ohlcv-and-news";
}

export interface NewsArticle {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment: { score: number; label: SentimentLabel };
  topics: string[];
  lang: "th" | "en";
}

export interface ApiEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
  error?: string;
}
