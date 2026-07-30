import type { FastifyInstance } from "fastify";
import symbolsSeed from "../data/symbols.seed.json" with { type: "json" };
import type { Market, SymbolInfo } from "../types/index.js";
import { cached } from "../cache/lru.js";
import { fetchNasdaqSymbols } from "../providers/nasdaq.js";
import { fetchSetSymbols } from "../providers/set.js";

const SEED: SymbolInfo[] = symbolsSeed as SymbolInfo[];
const NASDAQ_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const SET_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

async function getFullUsUniverse(app: FastifyInstance): Promise<SymbolInfo[]> {
  try {
    return await cached("nasdaq-full-list", "us", NASDAQ_CACHE_TTL_MS, fetchNasdaqSymbols);
  } catch (err) {
    app.log.warn(
      { err },
      "failed to fetch full NASDAQ symbol directory, falling back to curated seed list only"
    );
    return [];
  }
}

async function getFullSetUniverse(app: FastifyInstance): Promise<SymbolInfo[]> {
  try {
    return await cached("set-full-list", "set", SET_CACHE_TTL_MS, fetchSetSymbols);
  } catch (err) {
    app.log.warn(
      { err },
      "failed to fetch full SET symbol list (unverified provider, see providers/set.ts), falling back to curated seed list only"
    );
    return [];
  }
}

export async function symbolsRoutes(app: FastifyInstance) {
  app.get("/api/v1/symbols", async (request) => {
    const { query, market, limit } = request.query as {
      query?: string;
      market?: Market | "ALL";
      limit?: string;
    };
    const max = limit ? parseInt(limit, 10) : 100;

    let results = SEED;
    if (market && market !== "ALL") {
      results = results.filter((s) => s.market === market);
    }

    if (query) {
      const q = query.toLowerCase();
      const matchesQuery = (s: SymbolInfo) =>
        s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);

      let matched = results.filter(matchesQuery);

      // Curated seed list can't cover every listed instrument -- when
      // searching US names, widen against NASDAQ's free full symbol
      // directory so tickers outside the curated set are still findable.
      const seenSymbols = new Set(matched.map((s) => s.symbol));
      const includesUs = !market || market === "ALL" || market === "US";
      if (includesUs && matched.length < max) {
        const fullUsList = await getFullUsUniverse(app);
        for (const entry of fullUsList) {
          if (matched.length >= max) break;
          if (seenSymbols.has(entry.symbol)) continue;
          if (matchesQuery(entry)) {
            matched.push(entry);
            seenSymbols.add(entry.symbol);
          }
        }
      }

      // Same widening for SET -- best-effort, see providers/set.ts for why
      // this one is flagged unverified.
      const includesSet = !market || market === "ALL" || market === "SET";
      if (includesSet && matched.length < max) {
        const fullSetList = await getFullSetUniverse(app);
        for (const entry of fullSetList) {
          if (matched.length >= max) break;
          if (seenSymbols.has(entry.symbol)) continue;
          if (matchesQuery(entry)) {
            matched.push(entry);
            seenSymbols.add(entry.symbol);
          }
        }
      }

      results = matched;
    }

    return {
      data: results.slice(0, max),
      meta: {
        source: query ? "seed-list+nasdaq-symbol-directory+set-stock-list" : "seed-list",
        asOf: new Date().toISOString(),
      },
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
