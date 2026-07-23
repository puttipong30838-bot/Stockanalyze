import type { FastifyInstance } from "fastify";
import { cached } from "../cache/lru.js";
import { fetchChart, type ChartInterval, type ChartRange } from "../providers/yahoo.js";
import { fetchNews } from "../providers/news.js";
import {
  computeConsolidation,
  computeInstitutionalDemand,
  computeTrend,
  computeVolatility,
  computeVolume,
} from "../analysis/heuristics.js";
import { detectPatterns } from "../analysis/patterns.js";
import { aggregateSentiment } from "../analysis/sentiment.js";
import {
  computeHoldRecommendation,
  generateAiPlan,
  generateDetailedAnalysis,
  generateSummary,
} from "../analysis/rulesEngine.js";
import type { AnalysisBundle, SentimentResult, TradingMode } from "../types/index.js";
import symbolsSeed from "../data/symbols.seed.json" with { type: "json" };

const SEED = symbolsSeed as { symbol: string; name: string; market: string }[];

export async function analysisRoutes(app: FastifyInstance) {
  app.get("/api/v1/analysis/:symbol", async (request, reply) => {
    const { symbol } = request.params as { symbol: string };
    const { mode = "investor" } = request.query as { mode?: TradingMode };

    const resolvedMode: TradingMode = mode === "trader" ? "trader" : "investor";
    const interval: ChartInterval = resolvedMode === "trader" ? "5m" : "1d";
    const range: ChartRange = resolvedMode === "trader" ? "1d" : "6mo";

    try {
      const candles = await cached(
        "charts",
        `${symbol}:${interval}:${range}`,
        30_000,
        () => fetchChart(symbol, interval, range)
      );

      if (candles.length < 5) {
        reply.code(404);
        return { error: "not enough chart data available for analysis" };
      }

      const seedEntry = SEED.find(
        (s) => s.symbol.toLowerCase() === symbol.toLowerCase()
      );
      const newsQuery = seedEntry?.name ?? symbol;
      const newsLang = seedEntry?.market === "SET" ? "th" : "en";

      let newsSentiment: SentimentResult = { score: 0, label: "neutral" };
      try {
        const articles = await cached(
          "news",
          `${symbol}:${newsLang}`,
          120_000,
          () => fetchNews(newsQuery, newsLang, 10)
        );
        newsSentiment = aggregateSentiment(articles.map((a) => a.sentiment));
      } catch (newsErr) {
        app.log.warn({ err: newsErr }, "news fetch failed, defaulting sentiment to neutral");
      }

      const trend = computeTrend(candles);
      const volatility = computeVolatility(candles);
      const volume = computeVolume(candles);
      const institutionalDemand = computeInstitutionalDemand(candles);
      const consolidation = computeConsolidation(candles);
      const detectedPatterns = detectPatterns(candles);

      const signals = {
        symbol,
        mode: resolvedMode,
        trend,
        volatility,
        volume,
        institutionalDemand,
        consolidation,
        sentiment: newsSentiment,
      };

      const holdRecommendation = computeHoldRecommendation(signals);
      const aiPlan = generateAiPlan(signals, holdRecommendation);
      const summary = generateSummary(signals, holdRecommendation);
      const detailedAnalysis = generateDetailedAnalysis(signals, holdRecommendation);

      const bundle: AnalysisBundle = {
        symbol,
        mode: resolvedMode,
        trend,
        volatility,
        volume,
        institutionalDemand,
        consolidation,
        detectedPatterns,
        sentiment: newsSentiment,
        aiPlan,
        holdRecommendation,
        summary,
        detailedAnalysis,
        methodology: "heuristic-derived-from-public-ohlcv-and-news",
      };

      return {
        data: bundle,
        meta: {
          source: "yahoo-finance+heuristics",
          asOf: new Date().toISOString(),
          methodology: "heuristic",
        },
      };
    } catch (err) {
      app.log.error(err);
      reply.code(502);
      return { error: "failed to compute analysis" };
    }
  });
}
