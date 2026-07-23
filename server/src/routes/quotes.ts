import type { FastifyInstance } from "fastify";
import { cached } from "../cache/lru.js";
import { fetchQuotes } from "../providers/yahoo.js";

export async function quotesRoutes(app: FastifyInstance) {
  app.get("/api/v1/quotes", async (request, reply) => {
    const { symbols } = request.query as { symbols?: string };
    if (!symbols) {
      reply.code(400);
      return { error: "symbols query param is required, comma-separated" };
    }
    const list = symbols
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const data = await cached(
        "quotes",
        list.sort().join(","),
        20_000,
        () => fetchQuotes(list)
      );
      return { data, meta: { source: "yahoo-finance", asOf: new Date().toISOString() } };
    } catch (err) {
      app.log.error(err);
      reply.code(502);
      return { error: "failed to fetch quotes from upstream provider" };
    }
  });
}
