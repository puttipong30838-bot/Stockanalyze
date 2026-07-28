import type { FastifyInstance } from "fastify";
import { cached } from "../cache/lru.js";
import {
  fetchChart,
  type ChartInterval,
  type ChartRange,
} from "../providers/yahoo.js";
import { bollingerBands, closes, ema, sma } from "../analysis/indicators.js";

const VALID_INTERVALS: ChartInterval[] = ["1m", "5m", "15m", "1h", "1d", "1wk"];
const VALID_RANGES: ChartRange[] = ["1d", "5d", "1mo", "6mo", "ytd", "1y", "5y"];

export async function chartsRoutes(app: FastifyInstance) {
  app.get("/api/v1/charts/:symbol", async (request, reply) => {
    const { symbol } = request.params as { symbol: string };
    const { interval = "1d", range = "6mo" } = request.query as {
      interval?: string;
      range?: string;
    };

    if (!VALID_INTERVALS.includes(interval as ChartInterval)) {
      reply.code(400);
      return { error: `invalid interval, expected one of ${VALID_INTERVALS.join(", ")}` };
    }
    if (!VALID_RANGES.includes(range as ChartRange)) {
      reply.code(400);
      return { error: `invalid range, expected one of ${VALID_RANGES.join(", ")}` };
    }

    try {
      const candles = await cached(
        "charts",
        `${symbol}:${interval}:${range}`,
        30_000,
        () => fetchChart(symbol, interval as ChartInterval, range as ChartRange)
      );

      const c = closes(candles);
      const overlays = {
        sma20: sma(c, 20),
        sma50: sma(c, 50),
        ema20: ema(c, 20),
        bollinger: bollingerBands(c, 20),
      };

      return {
        data: { candles, overlays },
        meta: { source: "yahoo-finance", asOf: new Date().toISOString() },
      };
    } catch (err) {
      app.log.error(err);
      reply.code(502);
      return { error: "failed to fetch chart data from upstream provider" };
    }
  });
}
