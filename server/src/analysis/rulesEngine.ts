import type {
  AiPlanResult,
  ConsolidationResult,
  HoldRecommendation,
  InstitutionalDemandResult,
  SentimentResult,
  TradingMode,
  TrendResult,
  VolatilityResult,
  VolumeResult,
} from "../types/index.js";

interface Signals {
  symbol: string;
  mode: TradingMode;
  trend: TrendResult;
  volatility: VolatilityResult;
  volume: VolumeResult;
  institutionalDemand: InstitutionalDemandResult;
  consolidation: ConsolidationResult;
  sentiment: SentimentResult;
}

function bullishScore(s: Signals): number {
  let score = 0;
  if (s.trend.direction === "up") score += 2 * s.trend.confidence;
  if (s.trend.direction === "down") score -= 2 * s.trend.confidence;
  if (s.institutionalDemand.flag === "bullish") score += 1.5;
  if (s.institutionalDemand.flag === "bearish") score -= 1.5;
  if (s.sentiment.label === "positive") score += 1;
  if (s.sentiment.label === "negative") score -= 1;
  if (s.volume.callout === "spike" && s.trend.direction === "up") score += 0.5;
  if (s.volume.callout === "spike" && s.trend.direction === "down") score -= 0.5;
  if (s.consolidation.flag === "neutral") score *= 0.6;
  return score;
}

export function computeHoldRecommendation(s: Signals): HoldRecommendation {
  const score = bullishScore(s);

  let label: HoldRecommendation["label"] = "hold";
  if (score >= 3.5) label = "strong_buy";
  else if (score >= 2) label = "buy";
  else if (score <= -3.5) label = "strong_sell";
  else if (score <= -2) label = "reduce";
  else if (s.consolidation.flag === "neutral" && Math.abs(score) < 1) label = "watch";

  const parts: string[] = [];
  parts.push(
    `Trend is ${s.trend.direction} (confidence ${(s.trend.confidence * 100).toFixed(0)}%)`
  );
  parts.push(`volume is ${s.volume.callout.replace("_", " ")}`);
  if (s.institutionalDemand.flag !== "neutral") {
    parts.push(`institutional-demand heuristic flags ${s.institutionalDemand.flag}`);
  }
  parts.push(`news sentiment is ${s.sentiment.label}`);
  if (s.consolidation.flag === "neutral") {
    parts.push("price is currently in a consolidation zone with low participation");
  }

  return { label, rationale: parts.join("; ") + "." };
}

export function generateAiPlan(
  s: Signals,
  hold: HoldRecommendation
): AiPlanResult {
  const isInvestor = s.mode === "investor";
  const trendWord =
    s.trend.direction === "up" ? "uptrend" : s.trend.direction === "down" ? "downtrend" : "sideways range";

  let text: string;
  if (isInvestor) {
    if (hold.label === "strong_buy") {
      text = `${s.symbol} shows a strongly aligned ${trendWord} with supportive volume, institutional-demand signal, and sentiment all pointing the same direction. For a long-term position, this is a higher-conviction accumulation window, though still size for volatility (${s.volatility.level}) and reassess if any of these signals reverses.`;
    } else if (hold.label === "buy") {
      text = `${s.symbol} is in a ${trendWord} with supportive volume and sentiment. For a long-term position, consider accumulating on dips and holding through short-term volatility (${s.volatility.level}), reviewing again if the trend or institutional-demand signal reverses.`;
    } else if (hold.label === "strong_sell") {
      text = `${s.symbol} shows a strongly negative ${trendWord} with weak volume, sentiment, and institutional-demand signals aligned to the downside. For a long-term holder, this is a higher-conviction signal to reduce exposure meaningfully rather than just trim.`;
    } else if (hold.label === "reduce") {
      text = `${s.symbol} is showing a ${trendWord} with weakening signals. For a long-term holder, consider trimming exposure or waiting for trend stabilization before adding.`;
    } else if (hold.label === "watch") {
      text = `${s.symbol} is consolidating with low participation. For long-term investors, this is typically a wait-and-see phase — watch for a volume-confirmed breakout before committing new capital.`;
    } else {
      text = `${s.symbol} shows a mixed picture. A balanced long-term approach is to hold existing positions and wait for clearer trend or volume confirmation before changing allocation.`;
    }
  } else {
    if (hold.label === "strong_buy") {
      text = `${s.symbol} shows a high-conviction ${trendWord} setup — trend, volume, and institutional-demand signals all align bullish. A short-term trade could size up slightly versus a normal entry, still with a stop below the last consolidation low. Volatility is ${s.volatility.level}.`;
    } else if (hold.label === "buy") {
      text = `${s.symbol} shows a ${trendWord} with above-average volume. A short-term trade could look for entries near recent support, with a stop below the last consolidation low and a target near recent resistance. Volatility is ${s.volatility.level}, size the position accordingly.`;
    } else if (hold.label === "strong_sell") {
      text = `${s.symbol} shows a high-conviction bearish ${trendWord} — trend, volume, and institutional-demand signals all align to the downside. Traders holding long positions should consider a more decisive exit rather than a partial trim; short setups carry stronger confirmation here. Volatility is ${s.volatility.level}.`;
    } else if (hold.label === "reduce") {
      text = `${s.symbol} is showing weakening momentum in a ${trendWord}. Traders holding long positions may consider tightening stops or taking partial profits; volatility is ${s.volatility.level}.`;
    } else if (hold.label === "watch") {
      text = `${s.symbol} is range-bound with low volume — a lower-probability setup for a fresh trade. Wait for a volume spike breaking the consolidation zone before entering, in either direction.`;
    } else {
      text = `${s.symbol} lacks a clear directional edge right now. Consider standing aside or trading smaller size until trend, volume, and sentiment align.`;
    }
  }

  return { text, styleMode: s.mode };
}

export function generateSummary(s: Signals, hold: HoldRecommendation): string {
  return `${s.symbol}: ${s.trend.direction} trend, ${s.volatility.level} volatility, ${s.volume.callout.replace("_", " ")} volume, ${s.sentiment.label} news sentiment. Recommendation: ${hold.label.replace("_", " ").toUpperCase()}.`;
}

export function generateDetailedAnalysis(s: Signals, hold: HoldRecommendation): string {
  const lines: string[] = [];
  lines.push(
    `Trend: ${s.trend.direction} (confidence ${(s.trend.confidence * 100).toFixed(0)}%) based on EMA20/EMA50 relationship and recent price regression slope.`
  );
  lines.push(
    `Volatility: ${s.volatility.level} — realized volatility of ${s.volatility.realizedVolPct}% (annualized), which is at the ${(s.volatility.percentileRank * 100).toFixed(0)}th percentile of this stock's own recent history.`
  );
  lines.push(
    `Volume: relative volume ${s.volume.relativeVolume}x the 20-period average, classified as ${s.volume.callout.replace("_", " ")}.`
  );
  lines.push(
    `Institutional Demand / Whale Activity: heuristic composite score ${s.institutionalDemand.score}, flagged ${s.institutionalDemand.flag}. This is derived only from public volume + price-position patterns (large moves on above-average volume), not real order-flow or institutional-holdings data.`
  );
  if (s.consolidation.flag === "neutral") {
    lines.push(
      `Consolidation: price is currently inside a compressed range with below-average participation — a neutral, wait-and-see signal.`
    );
  }
  lines.push(`News Sentiment: ${s.sentiment.label} (score ${s.sentiment.score}) from recent headlines.`);
  lines.push(`Overall recommendation: ${hold.label.replace("_", " ").toUpperCase()} — ${hold.rationale}`);
  return lines.join(" ");
}
