import Fastify from "fastify";
import cors from "@fastify/cors";
import { symbolsRoutes } from "./routes/symbols.js";
import { quotesRoutes } from "./routes/quotes.js";
import { chartsRoutes } from "./routes/charts.js";
import { analysisRoutes } from "./routes/analysis.js";
import { newsRoutes } from "./routes/news.js";
import { moversRoutes } from "./routes/movers.js";
import { fxRoutes } from "./routes/fx.js";

export function buildServer() {
  const app = Fastify({ logger: true });

  app.register(cors, { origin: true });

  app.get("/health", async () => ({ status: "ok", time: new Date().toISOString() }));

  app.register(symbolsRoutes);
  app.register(quotesRoutes);
  app.register(chartsRoutes);
  app.register(analysisRoutes);
  app.register(newsRoutes);
  app.register(moversRoutes);
  app.register(fxRoutes);

  return app;
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;

if (isMain) {
  const app = buildServer();
  const port = Number(process.env.PORT) || 4000;
  app.listen({ port, host: "0.0.0.0" }).catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
}
