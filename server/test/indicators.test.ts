import { describe, expect, it } from "vitest";
import {
  bollingerBands,
  ema,
  linearRegressionSlope,
  logReturns,
  rollingRealizedVolatility,
  sma,
} from "../src/analysis/indicators.js";

describe("sma", () => {
  it("computes a simple moving average once enough values are seen", () => {
    const values = [1, 2, 3, 4, 5, 6];
    const result = sma(values, 3);
    expect(result[0]).toBeNull();
    expect(result[1]).toBeNull();
    expect(result[2]).toBeCloseTo(2); // (1+2+3)/3
    expect(result[5]).toBeCloseTo(5); // (4+5+6)/3
  });
});

describe("ema", () => {
  it("seeds with SMA then applies exponential weighting", () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8];
    const result = ema(values, 4);
    expect(result[3]).toBeCloseTo(2.5); // seed = avg(1..4)
    expect(result[7]).not.toBeNull();
  });
});

describe("bollingerBands", () => {
  it("keeps upper band above middle and lower band below middle", () => {
    const values = Array.from({ length: 30 }, (_, i) => 100 + Math.sin(i) * 5);
    const { upper, middle, lower } = bollingerBands(values, 20);
    for (let i = 19; i < values.length; i++) {
      expect(upper[i]!).toBeGreaterThanOrEqual(middle[i]!);
      expect(lower[i]!).toBeLessThanOrEqual(middle[i]!);
    }
  });
});

describe("logReturns", () => {
  it("returns one fewer value than the input and is zero for flat prices", () => {
    const flat = [100, 100, 100, 100];
    const returns = logReturns(flat);
    expect(returns).toHaveLength(3);
    expect(returns.every((r) => r === 0)).toBe(true);
  });
});

describe("rollingRealizedVolatility", () => {
  it("reports near-zero volatility for a flat price series", () => {
    const flat = new Array(30).fill(100);
    const series = rollingRealizedVolatility(flat, 10);
    const last = series[series.length - 1];
    expect(last).not.toBeNull();
    expect(last as number).toBeCloseTo(0, 5);
  });

  it("reports higher volatility for a noisy series than a flat one", () => {
    const flat = new Array(40).fill(100);
    const noisy = flat.map((v, i) => v + (i % 2 === 0 ? 5 : -5));
    const flatVol = rollingRealizedVolatility(flat, 14).at(-1) as number;
    const noisyVol = rollingRealizedVolatility(noisy, 14).at(-1) as number;
    expect(noisyVol).toBeGreaterThan(flatVol);
  });
});

describe("linearRegressionSlope", () => {
  it("detects a positive slope for a strictly increasing series", () => {
    const values = Array.from({ length: 10 }, (_, i) => i * 2);
    const { slope, r2 } = linearRegressionSlope(values);
    expect(slope).toBeCloseTo(2);
    expect(r2).toBeCloseTo(1, 1);
  });

  it("detects a negative slope for a strictly decreasing series", () => {
    const values = Array.from({ length: 10 }, (_, i) => 100 - i * 3);
    const { slope } = linearRegressionSlope(values);
    expect(slope).toBeLessThan(0);
  });
});
