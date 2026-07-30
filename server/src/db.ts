import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isTest = process.env.NODE_ENV === "test";
const dbPath = isTest ? ":memory:" : process.env.DB_PATH ?? path.join(__dirname, "..", "data", "app.db");

if (!isTest) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_watchlist (
    user_id INTEGER NOT NULL REFERENCES users(id),
    symbol TEXT NOT NULL,
    PRIMARY KEY (user_id, symbol)
  );

  CREATE TABLE IF NOT EXISTS user_settings (
    user_id INTEGER PRIMARY KEY REFERENCES users(id),
    language TEXT NOT NULL DEFAULT 'th',
    news_language TEXT NOT NULL DEFAULT 'th',
    mode TEXT NOT NULL DEFAULT 'investor'
  );
`);
