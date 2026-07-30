export type Market = "SET" | "US" | "CRYPTO" | "COMMODITY" | "FUND";

export interface SymbolInfo {
  symbol: string;
  name: string;
  market: Market;
  sector?: string;
}

export interface Candle {
  t: number; // unix seconds
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
  fiftyTwoWeekLow: number | null;
  fiftyTwoWeekHigh: number | null;
  marketCap: number | null;
}

export type TrendDirection = "up" | "down" | "sideways";

export interface TrendResult {
  direction: TrendDirection;
  confidence: number; // 0-1
}

export type VolatilityLevel = "low" | "medium" | "high";

export interface VolatilityResult {
  level: VolatilityLevel;
  realizedVolPct: number;
  percentileRank: number; // 0-1 vs own trailing history
}

export interface VolumeResult {
  relativeVolume: number; // ratio vs 20d avg
  callout: "above_average" | "below_average" | "spike" | "normal";
}

export type FlagLabel = "bullish" | "bearish" | "neutral";

export interface InstitutionalDemandResult {
  score: number;
  flag: FlagLabel;
  methodology: "heuristic";
}

export interface ConsolidationZone {
  startIndex: number;
  endIndex: number;
  low: number;
  high: number;
}

export interface ConsolidationResult {
  flag: "neutral" | null;
  zones: ConsolidationZone[];
}

export interface DetectedPattern {
  name: string;
  confidence: number;
  startIndex: number;
  endIndex: number;
}

export type SentimentLabel = "positive" | "neutral" | "negative";

export interface SentimentResult {
  score: number; // -1..1
  label: SentimentLabel;
}

export type TradingMode = "investor" | "trader";

export type HoldLabel = "strong_buy" | "buy" | "hold" | "reduce" | "strong_sell" | "watch";

export interface AiPlanResult {
  text: string;
  styleMode: TradingMode;
}

export interface HoldRecommendation {
  label: HoldLabel;
  rationale: string;
}

export interface AnalysisBundle {
  symbol: string;
  mode: TradingMode;
  trend: TrendResult;
  volatility: VolatilityResult;
  volume: VolumeResult;
  institutionalDemand: InstitutionalDemandResult;
  consolidation: ConsolidationResult;
  detectedPatterns: DetectedPattern[];
  sentiment: SentimentResult;
  aiPlan: AiPlanResult;
  holdRecommendation: HoldRecommendation;
  summary: string;
  detailedAnalysis: string;
  methodology: "heuristic-derived-from-public-ohlcv-and-news";
}

export type NewsLang = "th" | "en";

export interface NewsArticle {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment: SentimentResult;
  topics: string[];
  lang: NewsLang;
  description?: string;
}
