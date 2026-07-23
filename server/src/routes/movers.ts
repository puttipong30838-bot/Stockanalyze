import type { FastifyInstance } from "fastify";
import { cached } from "../cache/lru.js";
import { fetchQuotes } from "../providers/yahoo.js";
import type { Market } from "../types/index.js";
import symbolsSeed from "../data/symbols.seed.json" with { type: "json" };

const SEED = symbolsSeed as { symbol: string; market: Market }[];

export async function moversRoutes(app: FastifyInstance) {
  app.get("/api/v1/movers", async (request, reply) => {
    const { market = "ALL", type = "active" } = request.query as {
      market?: Market | "ALL";
      type?: "gainers" | "losers" | "active";
    };

    const symbols = SEED.filter((s) => market === "ALL" || s.market === market).map(
      (s) => s.symbol
    );

    try {
      const quotes = await cached(
        "movers-quotes",
        symbols.sort().join(","),
        20_000,
        () => fetchQuotes(symbols)
      );

      let sorted = [...quotes];
      if (type === "gainers") {
        sorted.sort((a, b) => (b.changePercent ?? -Infinity) - (a.changePercent ?? -Infinity));
      } else if (type === "losers") {
        sorted.sort((a, b) => (a.changePercent ?? Infinity) - (b.changePercent ?? Infinity));
      } else {
        sorted.sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));
      }

      return {
        data: sorted.slice(0, 20),
        meta: { source: "yahoo-finance", asOf: new Date().toISOString() },
      };
    } catch (err) {
      app.log.error(err);
      reply.code(502);
      return { error: "failed to compute movers" };
    }
  });
}
