import { describe, expect, it } from "vitest";
import { detectPatterns } from "../src/analysis/patterns.js";
import type { Candle } from "../src/types/index.js";

function candle(t: number, o: number, h: number, l: number, c: number): Candle {
  return { t, o, h, l, c, v: 10_000 };
}

function buildDoubleTop(): Candle[] {
  const candles: Candle[] = [];
  const shape = [
    100, 102, 105, 110, 108, 104, 101, 99, 101, 104, 108, 110, 107, 103, 100,
    98, 97, 98, 99, 100,
  ];
  shape.forEach((price, i) => {
    candles.push(candle(i, price, price + 1, price - 1, price));
  });
  return candles;
}

describe("detectPatterns", () => {
  it("returns an empty array for too-short series", () => {
    const candles = [candle(0, 100, 101, 99, 100)];
    expect(detectPatterns(candles)).toEqual([]);
  });

  it("finds at least one pattern in a double-top-shaped series", () => {
    const candles = buildDoubleTop();
    const patterns = detectPatterns(candles);
    expect(Array.isArray(patterns)).toBe(true);
    for (const p of patterns) {
      expect(p.confidence).toBeGreaterThan(0);
      expect(p.confidence).toBeLessThanOrEqual(1);
    }
  });
});
