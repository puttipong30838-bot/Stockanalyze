import type { FastifyInstance } from "fastify";
import { db } from "../db.js";
import { getUserIdFromRequest } from "../auth.js";

interface SettingsRow {
  language: string;
  news_language: string;
  mode: string;
}

const DEFAULT_SETTINGS = { language: "th", newsLanguage: "th", mode: "investor" };

export async function userRoutes(app: FastifyInstance) {
  app.get("/api/v1/user/watchlist", async (request, reply) => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      reply.code(401);
      return { error: "unauthorized" };
    }
    const rows = db
      .prepare("SELECT symbol FROM user_watchlist WHERE user_id = ?")
      .all(userId) as { symbol: string }[];
    return { data: rows.map((r) => r.symbol) };
  });

  app.put("/api/v1/user/watchlist", async (request, reply) => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      reply.code(401);
      return { error: "unauthorized" };
    }
    const { symbols } = request.body as { symbols?: unknown };
    if (!Array.isArray(symbols) || !symbols.every((s) => typeof s === "string")) {
      reply.code(400);
      return { error: "symbols must be an array of strings" };
    }

    const replaceAll = db.transaction((syms: string[]) => {
      db.prepare("DELETE FROM user_watchlist WHERE user_id = ?").run(userId);
      const insert = db.prepare("INSERT INTO user_watchlist (user_id, symbol) VALUES (?, ?)");
      for (const symbol of syms) insert.run(userId, symbol);
    });
    replaceAll(symbols);

    return { data: symbols };
  });

  app.get("/api/v1/user/settings", async (request, reply) => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      reply.code(401);
      return { error: "unauthorized" };
    }
    const row = db
      .prepare("SELECT language, news_language, mode FROM user_settings WHERE user_id = ?")
      .get(userId) as SettingsRow | undefined;
    if (!row) return { data: DEFAULT_SETTINGS };
    return { data: { language: row.language, newsLanguage: row.news_language, mode: row.mode } };
  });

  app.put("/api/v1/user/settings", async (request, reply) => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      reply.code(401);
      return { error: "unauthorized" };
    }
    const { language, newsLanguage, mode } = request.body as {
      language?: string;
      newsLanguage?: string;
      mode?: string;
    };
    const merged = {
      language: language ?? DEFAULT_SETTINGS.language,
      newsLanguage: newsLanguage ?? DEFAULT_SETTINGS.newsLanguage,
      mode: mode ?? DEFAULT_SETTINGS.mode,
    };
    db.prepare(
      `INSERT INTO user_settings (user_id, language, news_language, mode) VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         language = excluded.language,
         news_language = excluded.news_language,
         mode = excluded.mode`
    ).run(userId, merged.language, merged.newsLanguage, merged.mode);

    return { data: merged };
  });
}
