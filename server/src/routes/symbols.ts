import type { FastifyInstance } from "fastify";
import symbolsSeed from "../data/symbols.seed.json" with { type: "json" };
import type { Market, SymbolInfo } from "../types/index.js";

const SEED: SymbolInfo[] = symbolsSeed as SymbolInfo[];

export async function symbolsRoutes(app: FastifyInstance) {
  app.get("/api/v1/symbols", async (request) => {
    const { query, market, limit } = request.query as {
      query?: string;
      market?: Market | "ALL";
      limit?: string;
    };

    let results = SEED;
    if (market && market !== "ALL") {
      results = results.filter((s) => s.market === market);
    }
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(
        (s) =>
          s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      );
    }
    const max = limit ? parseInt(limit, 10) : 100;
    return {
      data: results.slice(0, max),
      meta: { source: "seed-list", asOf: new Date().toISOString() },
    };
  });

  app.get("/api/v1/symbols/:symbol", async (request, reply) => {
    const { symbol } = request.params as { symbol: string };
    const found = SEED.find(
      (s) => s.symbol.toLowerCase() === symbol.toLowerCase()
    );
    if (!found) {
      reply.code(404);
      return { error: "symbol not found in seed list" };
    }
    return { data: found, meta: { source: "seed-list", asOf: new Date().toISOString() } };
  });
}
