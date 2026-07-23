import type { Candle, DetectedPattern } from "../types/index.js";

interface SwingPoint {
  index: number;
  price: number;
  kind: "high" | "low";
}

function findSwingPoints(candles: Candle[], lookback = 3): SwingPoint[] {
  const points: SwingPoint[] = [];
  for (let i = lookback; i < candles.length - lookback; i++) {
    const window = candles.slice(i - lookback, i + lookback + 1);
    const high = candles[i].h;
    const low = candles[i].l;
    if (window.every((c) => c.h <= high)) {
      points.push({ index: i, price: high, kind: "high" });
    } else if (window.every((c) => c.l >= low)) {
      points.push({ index: i, price: low, kind: "low" });
    }
  }
  return points;
}

const NEAR_TOLERANCE = 0.02;

function isNear(a: number, b: number, tolerance = NEAR_TOLERANCE): boolean {
  return Math.abs(a - b) / Math.max(a, b) <= tolerance;
}

export function detectPatterns(candles: Candle[]): DetectedPattern[] {
  if (candles.length < 20) return [];
  const swings = findSwingPoints(candles);
  const highs = swings.filter((s) => s.kind === "high");
  const lows = swings.filter((s) => s.kind === "low");
  const patterns: DetectedPattern[] = [];

  // Double top: two comparable highs with a retracement low between them
  for (let i = 0; i < highs.length - 1; i++) {
    const a = highs[i];
    const b = highs[i + 1];
    if (isNear(a.price, b.price)) {
      const between = lows.filter((l) => l.index > a.index && l.index < b.index);
      if (between.length > 0) {
        patterns.push({
          name: "double_top",
          confidence: 0.6,
          startIndex: a.index,
          endIndex: b.index,
        });
      }
    }
  }

  // Double bottom: two comparable lows with a rally high between them
  for (let i = 0; i < lows.length - 1; i++) {
    const a = lows[i];
    const b = lows[i + 1];
    if (isNear(a.price, b.price)) {
      const between = highs.filter((h) => h.index > a.index && h.index < b.index);
      if (between.length > 0) {
        patterns.push({
          name: "double_bottom",
          confidence: 0.6,
          startIndex: a.index,
          endIndex: b.index,
        });
      }
    }
  }

  // Head and shoulders: three highs, middle highest, outer two comparable
  for (let i = 0; i < highs.length - 2; i++) {
    const [left, head, right] = [highs[i], highs[i + 1], highs[i + 2]];
    if (head.price > left.price && head.price > right.price && isNear(left.price, right.price, 0.04)) {
      patterns.push({
        name: "head_and_shoulders",
        confidence: 0.55,
        startIndex: left.index,
        endIndex: right.index,
      });
    }
  }

  // Inverse head and shoulders
  for (let i = 0; i < lows.length - 2; i++) {
    const [left, head, right] = [lows[i], lows[i + 1], lows[i + 2]];
    if (head.price < left.price && head.price < right.price && isNear(left.price, right.price, 0.04)) {
      patterns.push({
        name: "inverse_head_and_shoulders",
        confidence: 0.55,
        startIndex: left.index,
        endIndex: right.index,
      });
    }
  }

  // Triangle/wedge: converging trendlines over recent highs and lows
  const recentHighs = highs.slice(-4);
  const recentLows = lows.slice(-4);
  if (recentHighs.length >= 3 && recentLows.length >= 3) {
    const highSlope =
      (recentHighs[recentHighs.length - 1].price - recentHighs[0].price) /
      Math.max(1, recentHighs[recentHighs.length - 1].index - recentHighs[0].index);
    const lowSlope =
      (recentLows[recentLows.length - 1].price - recentLows[0].price) /
      Math.max(1, recentLows[recentLows.length - 1].index - recentLows[0].index);
    if (highSlope < 0 && lowSlope > 0) {
      patterns.push({
        name: "symmetrical_triangle",
        confidence: 0.5,
        startIndex: Math.min(recentHighs[0].index, recentLows[0].index),
        endIndex: candles.length - 1,
      });
    } else if (highSlope < 0 && Math.abs(lowSlope) < Math.abs(highSlope) * 0.3) {
      patterns.push({
        name: "descending_wedge",
        confidence: 0.45,
        startIndex: Math.min(recentHighs[0].index, recentLows[0].index),
        endIndex: candles.length - 1,
      });
    } else if (lowSlope > 0 && Math.abs(highSlope) < Math.abs(lowSlope) * 0.3) {
      patterns.push({
        name: "ascending_wedge",
        confidence: 0.45,
        startIndex: Math.min(recentHighs[0].index, recentLows[0].index),
        endIndex: candles.length - 1,
      });
    }
  }

  return patterns;
}
