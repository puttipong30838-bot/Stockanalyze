import type {
  Candle,
  ConsolidationResult,
  ConsolidationZone,
  InstitutionalDemandResult,
  TrendResult,
  VolatilityResult,
  VolumeResult,
} from "../types/index.js";
import {
  closes,
  ema,
  linearRegressionSlope,
  rollingRealizedVolatility,
  volumeSma,
} from "./indicators.js";

export function computeTrend(candles: Candle[]): TrendResult {
  const c = closes(candles);
  if (c.length < 50) {
    const { slope, r2 } = linearRegressionSlope(c);
    return {
      direction: slope > 0 ? "up" : slope < 0 ? "down" : "sideways",
      confidence: Math.round(r2 * 100) / 100,
    };
  }
  const ema20 = ema(c, 20);
  const ema50 = ema(c, 50);
  const lastEma20 = ema20[ema20.length - 1];
  const lastEma50 = ema50[ema50.length - 1];
  const { slope, r2 } = linearRegressionSlope(c.slice(-30));

  let direction: TrendResult["direction"] = "sideways";
  if (lastEma20 != null && lastEma50 != null) {
    const spreadPct = (lastEma20 - lastEma50) / lastEma50;
    if (spreadPct > 0.005 && slope > 0) direction = "up";
    else if (spreadPct < -0.005 && slope < 0) direction = "down";
  }

  return { direction, confidence: Math.round(r2 * 100) / 100 };
}

export function computeVolatility(candles: Candle[]): VolatilityResult {
  const c = closes(candles);
  const window = Math.min(14, Math.max(5, Math.floor(c.length / 4)));
  const series = rollingRealizedVolatility(c, window);
  const valid = series.filter((v): v is number => v != null);
  const current = valid[valid.length - 1] ?? 0;

  let percentileRank = 0.5;
  if (valid.length > 1) {
    const below = valid.filter((v) => v <= current).length;
    percentileRank = below / valid.length;
  }

  let level: VolatilityResult["level"] = "medium";
  if (percentileRank < 0.33) level = "low";
  else if (percentileRank > 0.66) level = "high";

  return {
    level,
    realizedVolPct: Math.round(current * 100) / 100,
    percentileRank: Math.round(percentileRank * 100) / 100,
  };
}

export function computeVolume(candles: Candle[]): VolumeResult {
  const vol20 = volumeSma(candles, Math.min(20, candles.length));
  const lastAvg = vol20[vol20.length - 1];
  const currentVolume = candles[candles.length - 1]?.v ?? 0;

  if (!lastAvg || lastAvg === 0) {
    return { relativeVolume: 1, callout: "normal" };
  }

  const relativeVolume = Math.round((currentVolume / lastAvg) * 100) / 100;
  let callout: VolumeResult["callout"] = "normal";
  if (relativeVolume >= 2) callout = "spike";
  else if (relativeVolume >= 1.2) callout = "above_average";
  else if (relativeVolume <= 0.7) callout = "below_average";

  return { relativeVolume, callout };
}

export function computeInstitutionalDemand(
  candles: Candle[]
): InstitutionalDemandResult {
  const window = candles.slice(-10);
  const vol20 = volumeSma(candles, Math.min(20, candles.length));

  let score = 0;
  for (let i = 0; i < window.length; i++) {
    const idx = candles.length - window.length + i;
    const candle = window[i];
    const avgVol = vol20[idx];
    if (!avgVol) continue;

    const dayRange = candle.h - candle.l;
    const closePosition = dayRange === 0 ? 0.5 : (candle.c - candle.l) / dayRange;
    const isUpDay = candle.c > candle.o;
    const volumeZLike = candle.v / avgVol;

    if (volumeZLike > 1.5 && closePosition > 0.66 && isUpDay) {
      score += 1;
    } else if (volumeZLike > 1.5 && closePosition < 0.33 && !isUpDay) {
      score -= 1;
    }
  }

  let flag: InstitutionalDemandResult["flag"] = "neutral";
  if (score >= 3) flag = "bullish";
  else if (score <= -3) flag = "bearish";

  return { score, flag, methodology: "heuristic" };
}

export function computeConsolidation(
  candles: Candle[],
  rangeThresholdPct = 0.05,
  minBars = 10
): ConsolidationResult {
  const zones: ConsolidationZone[] = [];
  let start = 0;

  for (let end = 0; end < candles.length; end++) {
    const window = candles.slice(start, end + 1);
    const high = Math.max(...window.map((c) => c.h));
    const low = Math.min(...window.map((c) => c.l));
    const meanClose =
      window.reduce((acc, c) => acc + c.c, 0) / window.length;
    const rangePct = meanClose === 0 ? 0 : (high - low) / meanClose;

    if (rangePct > rangeThresholdPct) {
      if (end - start >= minBars) {
        zones.push({ startIndex: start, endIndex: end - 1, low, high });
      }
      start = end;
    }
  }

  if (candles.length - start >= minBars) {
    const window = candles.slice(start);
    const high = Math.max(...window.map((c) => c.h));
    const low = Math.min(...window.map((c) => c.l));
    zones.push({ startIndex: start, endIndex: candles.length - 1, low, high });
  }

  const lastZone = zones[zones.length - 1];
  const isCurrentlyConsolidating =
    !!lastZone && lastZone.endIndex >= candles.length - Math.max(3, minBars / 2);

  return {
    flag: isCurrentlyConsolidating ? "neutral" : null,
    zones,
  };
}
