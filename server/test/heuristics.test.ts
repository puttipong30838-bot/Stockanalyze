import { describe, expect, it } from "vitest";
import {
  computeConsolidation,
  computeInstitutionalDemand,
  computeTrend,
  computeVolatility,
  computeVolume,
} from "../src/analysis/heuristics.js";
import { makeFlatCandles, makeTrendingCandles } from "./fixtures.js";

describe("computeTrend", () => {
  it("labels a strongly rising series as up", () => {
    const candles = makeTrendingCandles(80, 100, 1.5, { volatility: 0.1 });
    const result = computeTrend(candles);
    expect(result.direction).toBe("up");
  });

  it("labels a strongly falling series as down", () => {
    const candles = makeTrendingCandles(80, 200, -1.5, { volatility: 0.1 });
    const result = computeTrend(candles);
    expect(result.direction).toBe("down");
  });
});

describe("computeVolatility", () => {
  it("classifies a flat series as low volatility", () => {
    const candles = makeFlatCandles(60, 100, 0.001);
    const result = computeVolatility(candles);
    expect(result.realizedVolPct).toBeLessThan(5);
  });
});

describe("computeVolume", () => {
  it("flags a volume spike on the latest bar", () => {
    const candles = makeFlatCandles(30, 100, 0.01, 50_000);
    candles[candles.length - 1].v = 50_000 * 3;
    const result = computeVolume(candles);
    expect(result.callout).toBe("spike");
    expect(result.relativeVolume).toBeGreaterThan(2);
  });

  it("calls out below-average volume", () => {
    const candles = makeFlatCandles(30, 100, 0.01, 50_000);
    candles[candles.length - 1].v = 50_000 * 0.3;
    const result = computeVolume(candles);
    expect(result.callout).toBe("below_average");
  });
});

describe("computeInstitutionalDemand", () => {
  it("flags bullish when trailing bars show big up moves on high volume", () => {
    const candles = makeFlatCandles(30, 100, 0.005, 50_000);
    for (let i = candles.length - 5; i < candles.length; i++) {
      candles[i].v = 50_000 * 3;
      candles[i].o = 100;
      candles[i].c = 105;
      candles[i].l = 99;
      candles[i].h = 105.5;
    }
    const result = computeInstitutionalDemand(candles);
    expect(result.flag).toBe("bullish");
    expect(result.methodology).toBe("heuristic");
  });

  it("stays neutral for unremarkable trading", () => {
    const candles = makeFlatCandles(30, 100, 0.005, 50_000);
    const result = computeInstitutionalDemand(candles);
    expect(result.flag).toBe("neutral");
  });
});

describe("computeConsolidation", () => {
  it("detects a consolidation zone in a tight, range-bound series", () => {
    const candles = makeFlatCandles(40, 100, 0.01);
    const result = computeConsolidation(candles, 0.05, 10);
    expect(result.zones.length).toBeGreaterThan(0);
    expect(result.flag).toBe("neutral");
  });

  it("does not flag consolidation for a wide trending range", () => {
    const candles = makeTrendingCandles(40, 100, 3, { volatility: 0.1 });
    const result = computeConsolidation(candles, 0.03, 10);
    expect(result.flag).toBeNull();
  });
});
