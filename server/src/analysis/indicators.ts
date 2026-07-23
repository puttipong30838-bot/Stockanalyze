import type { Candle } from "../types/index.js";

export function sma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

export function ema(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  const k = 2 / (period + 1);
  let prev: number | null = null;
  for (let i = 0; i < values.length; i++) {
    if (i === period - 1) {
      const seed = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
      prev = seed;
      out[i] = seed;
    } else if (i >= period) {
      prev = values[i] * k + (prev as number) * (1 - k);
      out[i] = prev;
    }
  }
  return out;
}

export function bollingerBands(
  values: number[],
  period = 20,
  stdDevMultiplier = 2
): { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] } {
  const middle = sma(values, period);
  const upper: (number | null)[] = new Array(values.length).fill(null);
  const lower: (number | null)[] = new Array(values.length).fill(null);
  for (let i = period - 1; i < values.length; i++) {
    const window = values.slice(i - period + 1, i + 1);
    const mean = middle[i] as number;
    const variance =
      window.reduce((acc, v) => acc + (v - mean) ** 2, 0) / period;
    const stdDev = Math.sqrt(variance);
    upper[i] = mean + stdDevMultiplier * stdDev;
    lower[i] = mean - stdDevMultiplier * stdDev;
  }
  return { upper, middle, lower };
}

export function logReturns(closes: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    out.push(Math.log(closes[i] / closes[i - 1]));
  }
  return out;
}

export function rollingRealizedVolatility(
  closes: number[],
  window = 14,
  annualizeFactor = 252
): (number | null)[] {
  const returns = logReturns(closes);
  const out: (number | null)[] = new Array(closes.length).fill(null);
  for (let i = window; i < closes.length; i++) {
    const windowReturns = returns.slice(i - window, i);
    const mean =
      windowReturns.reduce((a, b) => a + b, 0) / windowReturns.length;
    const variance =
      windowReturns.reduce((acc, r) => acc + (r - mean) ** 2, 0) /
      windowReturns.length;
    const stdDev = Math.sqrt(variance);
    out[i] = stdDev * Math.sqrt(annualizeFactor) * 100;
  }
  return out;
}

export function linearRegressionSlope(values: number[]): {
  slope: number;
  r2: number;
} {
  const n = values.length;
  if (n < 2) return { slope: 0, r2: 0 };
  const xs = values.map((_, i) => i);
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let denom = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - xMean) * (values[i] - yMean);
    denom += (xs[i] - xMean) ** 2;
  }
  const slope = denom === 0 ? 0 : num / denom;
  const intercept = yMean - slope * xMean;
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const predicted = slope * xs[i] + intercept;
    ssRes += (values[i] - predicted) ** 2;
    ssTot += (values[i] - yMean) ** 2;
  }
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  return { slope, r2: Math.max(0, Math.min(1, r2)) };
}

export function volumeSma(candles: Candle[], period: number): (number | null)[] {
  return sma(
    candles.map((c) => c.v),
    period
  );
}

export function closes(candles: Candle[]): number[] {
  return candles.map((c) => c.c);
}
