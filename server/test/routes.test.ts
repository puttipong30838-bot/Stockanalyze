import { afterEach, describe, expect, it, vi } from "vitest";
import { makeFlatCandles, makeTrendingCandles } from "./fixtures.js";

vi.mock("../src/providers/yahoo.js", () => ({
  fetchChart: vi.fn(async (_symbol: string, _interval: string, _range: string) =>
    makeTrendingCandles(60, 100, 1, { volatility: 0.1 })
  ),
  fetchQuotes: vi.fn(async (symbols: string[]) =>
    symbols.map((symbol) => ({
      symbol,
      shortName: `${symbol} Inc.`,
      price: 123.45,
      change: 1.2,
      changePercent: 0.98,
      dayHigh: 125,
      dayLow: 120,
      prevClose: 122.25,
      volume: 1_000_000,
      currency: "USD",
      marketState: "REGULAR",
    }))
  ),
  searchSymbols: vi.fn(async () => []),
}));

vi.mock("../src/providers/news.js", () => ({
  fetchNews: vi.fn(async (_query: string, lang: "th" | "en") => [
    {
      id: "abc123",
      title: lang === "th" ? "บริษัทกำไรพุ่ง ทำนิวไฮ" : "Company beats earnings, stock surges",
      source: "Test Source",
      url: "https://example.com/article",
      publishedAt: new Date().toISOString(),
      sentiment: { score: 0.6, label: "positive" as const },
      topics: ["earnings"],
      lang,
    },
  ]),
}));

const { buildServer } = await import("../src/index.js");

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /health", () => {
  it("returns ok status", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe("ok");
    await app.close();
  });
});

describe("GET /api/v1/symbols", () => {
  it("returns seed-list symbols filtered by market", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/api/v1/symbols?market=SET&limit=5" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.every((s: { market: string }) => s.market === "SET")).toBe(true);
    await app.close();
  });

  it("filters by query text", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/api/v1/symbols?query=apple" });
    const body = res.json();
    expect(body.data.some((s: { symbol: string }) => s.symbol === "AAPL")).toBe(true);
    await app.close();
  });
});

describe("GET /api/v1/quotes", () => {
  it("requires a symbols query param", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/api/v1/quotes" });
    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it("returns quotes for requested symbols using the mocked provider", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/api/v1/quotes?symbols=AAPL,PTT.BK" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data).toHaveLength(2);
    expect(body.data[0].price).toBe(123.45);
    await app.close();
  });
});

describe("GET /api/v1/charts/:symbol", () => {
  it("rejects an invalid interval", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/api/v1/charts/AAPL?interval=3m" });
    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it("returns candles and overlays for a valid request", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/api/v1/charts/AAPL?interval=1d&range=6mo" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.candles.length).toBeGreaterThan(0);
    expect(body.data.overlays).toHaveProperty("sma20");
    await app.close();
  });
});

describe("GET /api/v1/analysis/:symbol", () => {
  it("returns a full analysis bundle tagged as heuristic", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/api/v1/analysis/AAPL?mode=investor" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.methodology).toBe("heuristic-derived-from-public-ohlcv-and-news");
    expect(body.data).toHaveProperty("trend");
    expect(body.data).toHaveProperty("holdRecommendation");
    expect(body.data).toHaveProperty("aiPlan");
    await app.close();
  });

  it("supports trader mode with a shorter default lookback", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/api/v1/analysis/AAPL?mode=trader" });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.mode).toBe("trader");
    await app.close();
  });
});

describe("GET /api/v1/news", () => {
  it("returns articles with sentiment and topics", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/api/v1/news?symbol=AAPL&lang=en" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.articles.length).toBeGreaterThan(0);
    expect(body.data.articles[0]).toHaveProperty("sentiment");
    await app.close();
  });
});

describe("GET /api/v1/movers", () => {
  it("returns sorted movers", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/api/v1/movers?market=US&type=gainers" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.data)).toBe(true);
    await app.close();
  });
});
