import type { FastifyInstance } from "fastify";
import { cached } from "../cache/lru.js";
import { fetchExchangeRate } from "../providers/yahoo.js";

export async function fxRoutes(app: FastifyInstance) {
  app.get("/api/v1/fx", async (request, reply) => {
    try {
      const usdThb = await cached("fx", "USDTHB=X", 300_000, () =>
        fetchExchangeRate("THB=X")
      );
      return {
        data: { usdThb },
        meta: { source: "yahoo-finance", asOf: new Date().toISOString() },
      };
    } catch (err) {
      app.log.error(err);
      reply.code(502);
      return { error: "failed to fetch exchange rate" };
    }
  });
}
