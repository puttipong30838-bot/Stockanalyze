import type { FastifyInstance } from "fastify";
import { cached } from "../cache/lru.js";
import { fetchNews } from "../providers/news.js";
import type { NewsLang } from "../types/index.js";
import symbolsSeed from "../data/symbols.seed.json" with { type: "json" };

const SEED = symbolsSeed as { symbol: string; name: string }[];

export async function newsRoutes(app: FastifyInstance) {
  app.get("/api/v1/news", async (request, reply) => {
    const { symbol, lang = "en", limit } = request.query as {
      symbol?: string;
      lang?: NewsLang;
      limit?: string;
    };

    const query = symbol
      ? SEED.find((s) => s.symbol.toLowerCase() === symbol.toLowerCase())?.name ?? symbol
      : lang === "th"
        ? "หุ้นไทย ตลาดหุ้น"
        : "stock market";

    const resolvedLang: NewsLang = lang === "th" ? "th" : "en";
    const max = limit ? parseInt(limit, 10) : 30;

    try {
      const articles = await cached(
        "news",
        `${query}:${resolvedLang}:${max}`,
        120_000,
        () => fetchNews(query, resolvedLang, max)
      );
      return {
        data: { articles },
        meta: { source: "google-news-rss", asOf: new Date().toISOString() },
      };
    } catch (err) {
      app.log.error(err);
      reply.code(502);
      return { error: "failed to fetch news" };
    }
  });
}
