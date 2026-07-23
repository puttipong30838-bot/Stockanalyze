import { describe, expect, it } from "vitest";
import { aggregateSentiment, extractTopics, scoreSentiment } from "../src/analysis/sentiment.js";

describe("scoreSentiment (en)", () => {
  it("scores a clearly positive headline as positive", () => {
    const result = scoreSentiment("Company beats earnings estimates, stock surges to record high", "en");
    expect(result.label).toBe("positive");
    expect(result.score).toBeGreaterThan(0);
  });

  it("scores a clearly negative headline as negative", () => {
    const result = scoreSentiment("Company misses estimates amid lawsuit and layoffs", "en");
    expect(result.label).toBe("negative");
    expect(result.score).toBeLessThan(0);
  });

  it("scores a neutral headline as neutral", () => {
    const result = scoreSentiment("Company to hold annual shareholder meeting next week", "en");
    expect(result.label).toBe("neutral");
  });
});

describe("scoreSentiment (th)", () => {
  it("scores a Thai positive headline as positive", () => {
    const result = scoreSentiment("บริษัทกำไรพุ่ง ทำนิวไฮ นักลงทุนมั่นใจ", "th");
    expect(result.label).toBe("positive");
  });

  it("scores a Thai negative headline as negative", () => {
    const result = scoreSentiment("บริษัทขาดทุน หุ้นร่วง นักลงทุนเทขาย", "th");
    expect(result.label).toBe("negative");
  });
});

describe("aggregateSentiment", () => {
  it("returns neutral for an empty list", () => {
    expect(aggregateSentiment([])).toEqual({ score: 0, label: "neutral" });
  });

  it("averages multiple sentiment scores", () => {
    const result = aggregateSentiment([
      { score: 0.5, label: "positive" },
      { score: 0.3, label: "positive" },
    ]);
    expect(result.label).toBe("positive");
    expect(result.score).toBeCloseTo(0.4);
  });
});

describe("extractTopics", () => {
  it("tags earnings-related headlines", () => {
    expect(extractTopics("Company reports strong quarterly earnings")).toContain("earnings");
  });

  it("tags dividend-related headlines", () => {
    expect(extractTopics("Board approves dividend increase")).toContain("dividend");
  });

  it("returns an empty array when nothing matches", () => {
    expect(extractTopics("A totally unrelated sentence about weather")).toEqual([]);
  });
});
