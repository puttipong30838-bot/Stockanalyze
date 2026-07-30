import { describe, expect, it } from "vitest";
import { rangeToDates } from "../src/providers/yahoo.js";

describe("rangeToDates", () => {
  it("computes ytd as January 1st of the current year through now", () => {
    const { period1, period2 } = rangeToDates("ytd");
    expect(period1.getMonth()).toBe(0);
    expect(period1.getDate()).toBe(1);
    expect(period1.getFullYear()).toBe(period2.getFullYear());
    expect(period1.getHours()).toBe(0);
    expect(period1.getTime()).toBeLessThan(period2.getTime());
  });

  it("computes 1y as one year before now", () => {
    const { period1, period2 } = rangeToDates("1y");
    expect(period2.getFullYear() - period1.getFullYear()).toBe(1);
  });

  it("computes 5d as five days before now", () => {
    const { period1, period2 } = rangeToDates("5d");
    const diffDays = (period2.getTime() - period1.getTime()) / 86_400_000;
    expect(diffDays).toBeCloseTo(5, 1);
  });

  it("pages further back from an explicit end anchor instead of now", () => {
    const end = new Date("2024-06-15T00:00:00Z");
    const { period1, period2 } = rangeToDates("1mo", end);
    expect(period2.getTime()).toBe(end.getTime());
    expect(period2.getMonth() - period1.getMonth() === 1 || period1.getMonth() === 11).toBe(true);
  });
});
