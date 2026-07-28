import { describe, expect, it } from "vitest";
import { computeHoldRecommendation, generateAiPlan } from "../src/analysis/rulesEngine.js";

function baseSignals(overrides: Partial<Parameters<typeof computeHoldRecommendation>[0]> = {}) {
  return {
    symbol: "TEST",
    mode: "investor" as const,
    trend: { direction: "sideways" as const, confidence: 0 },
    volatility: { level: "medium" as const, realizedVolPct: 20, percentileRank: 0.5 },
    volume: { relativeVolume: 1, callout: "normal" as const },
    institutionalDemand: { score: 0, flag: "neutral" as const, methodology: "heuristic" as const },
    consolidation: { flag: null, zones: [] },
    sentiment: { score: 0, label: "neutral" as const },
    ...overrides,
  };
}

describe("computeHoldRecommendation tiers", () => {
  it("returns strong_buy when trend, institutional demand, and sentiment all align strongly bullish", () => {
    const signals = baseSignals({
      trend: { direction: "up", confidence: 0.9 },
      institutionalDemand: { score: 4, flag: "bullish", methodology: "heuristic" },
      sentiment: { score: 0.5, label: "positive" },
      volume: { relativeVolume: 2.2, callout: "spike" },
    });
    const result = computeHoldRecommendation(signals);
    expect(result.label).toBe("strong_buy");
  });

  it("returns strong_sell when everything aligns strongly bearish", () => {
    const signals = baseSignals({
      trend: { direction: "down", confidence: 0.9 },
      institutionalDemand: { score: -4, flag: "bearish", methodology: "heuristic" },
      sentiment: { score: -0.5, label: "negative" },
      volume: { relativeVolume: 2.2, callout: "spike" },
    });
    const result = computeHoldRecommendation(signals);
    expect(result.label).toBe("strong_sell");
  });

  it("falls back to a plain buy for a moderately bullish setup", () => {
    const signals = baseSignals({
      trend: { direction: "up", confidence: 0.8 },
      sentiment: { score: 0.5, label: "positive" },
    });
    const result = computeHoldRecommendation(signals);
    expect(result.label).toBe("buy");
  });

  it("stays neutral (hold) with no strong signals", () => {
    const result = computeHoldRecommendation(baseSignals());
    expect(result.label).toBe("hold");
  });
});

describe("generateAiPlan wording for new tiers", () => {
  it("uses stronger-conviction language for strong_buy in investor mode", () => {
    const signals = baseSignals({ trend: { direction: "up", confidence: 0.9 } });
    const plan = generateAiPlan(signals, { label: "strong_buy", rationale: "test" });
    expect(plan.text.toLowerCase()).toContain("higher-conviction");
  });

  it("uses stronger-conviction language for strong_sell in trader mode", () => {
    const signals = baseSignals({
      mode: "trader",
      trend: { direction: "down", confidence: 0.9 },
    });
    const plan = generateAiPlan(signals, { label: "strong_sell", rationale: "test" });
    expect(plan.text.toLowerCase()).toContain("high-conviction");
  });
});
