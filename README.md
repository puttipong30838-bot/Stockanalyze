# StockPulse

Mobile stock analysis app (SET, US, crypto, commodities, US mutual funds) with
charts, heuristic technical/news analysis, and bilingual (Thai/English) text-to-speech
news reading. True-black theme with a mint/blue brand accent kept separate from
bullish/bearish price colors (TradingView-inspired), Inter/Noto Sans Thai
typography. Built with a free/keyless data stack — no paid API keys required.

## Structure

- `server/` — Fastify + TypeScript API. Fetches quotes/charts from Yahoo Finance
  (unofficial, free) and news from Google News RSS, computes all technical
  indicators and heuristic analysis (trend, volatility, volume, institutional-demand
  proxy, consolidation zones, pattern detection, sentiment, AI plan/hold/summary
  including Strong Buy/Strong Sell tiers), plus a live USD/THB FX rate.
- `app/` — Expo (React Native) app. Browse stocks/crypto/commodities/funds via
  category chips, view candlestick charts (TradingView `lightweight-charts`) with
  continuous pan-to-load-more history, a 1D/5D/1M/6M/YTD/1Y/5Y quick-jump range
  selector, up to 2 compare-symbol overlays, trendline/horizontal-line drawing
  tools, and chart sharing; day-range and 52-week-range bars, a full analysis
  panel, news with topic filters and TTS, watchlist, Investor/Trader mode
  toggle, Thai/English UI, free accounts, and a Community tab (posts, likes,
  comments, follows, profiles).

## Running it

### 1. Backend

```
cd server
npm install
npm run dev        # starts on http://localhost:4000
npm test           # runs the offline unit/route test suite
```

Accounts are optional and free (email/password, just to sync watchlist and
settings across devices — no payment tiers). They're backed by a local SQLite
file at `server/data/app.db` (auto-created, gitignored) via `better-sqlite3` —
zero external service, still fully free. Set a `JWT_SECRET` env var in any
real deployment; without one the server falls back to a fixed dev-only secret
(see `server/src/auth.ts`), which is fine for local testing but not for
production.

The same account also unlocks the Community tab (posts, likes, comments,
follows, profiles — `server/src/routes/community.ts`, same SQLite DB).
Reading the feed works for guests; posting, liking, commenting, and following
require logging in.

### 2. Mobile app

The app needs the backend's URL. **On a real phone, `localhost` will not work** —
use your computer's LAN IP (e.g. `http://192.168.1.20:4000`) or a deployed URL.

```
cd app
EXPO_PUBLIC_API_BASE_URL=http://<your-computer-LAN-IP>:4000 npx expo start
```

Scan the QR code with the Expo Go app on your phone. This is the fastest way to
try the real app today, with no build step. To eventually get a real installable
APK, run `npx eas build -p android` (requires a free Expo/EAS account).

## Important notes

- **All "AI" analysis (Insight, Trend, Volatility, Institutional Demand/Whale
  Activity, Consolidation, Patterns, AI Plan, Sentiment) is computed by
  deterministic rules/heuristics from public price, volume, and news data.**
  There is no real institutional order-flow feed behind "Institutional Demand /
  Whale Activity" — it's a volume/price-pattern proxy, clearly labeled as such in
  both the API (`methodology: "heuristic"`) and the UI.
- Yahoo Finance's endpoints are free but unofficial and can change without
  notice; all access is isolated behind `server/src/providers/yahoo.ts` so a
  future fix is a single-file change.
- **US stocks**: search widens beyond the curated seed list to NASDAQ Trader's
  free, official, daily-updated symbol directory (`nasdaqlisted.txt` +
  `otherlisted.txt`, no key required) — effectively the full US-listed
  universe (~8,000+ tickers) is searchable by name/ticker, cached 24h
  (`server/src/providers/nasdaq.ts`). Falls back to the curated list alone if
  that fetch ever fails.
- **Thai (SET) stocks**: search is widened the same way as US, via
  `server/src/providers/set.ts` attempting to fetch SET's own public
  listed-company data, cached 24h, falling back to the curated seed list
  (`server/src/data/symbols.seed.json`, ~157 SET names) on any failure. Unlike
  NASDAQ Trader's decades-stable plain-text directory, there's no equivalent
  long-standing free bulk file for the full SET universe, and this endpoint's
  URL/response shape was never verified against the live site (this sandbox's
  network policy blocks set.or.th) — **treat this one as unverified and likely
  needing a follow-up fix** once actually run with real internet access; the
  fix is isolated to that single file. Browsing/movers for all markets stays
  seed-list based; only free-text search widens to the fetched directories.
- "Gold" is the international spot price (USD/oz, via Yahoo `GC=F`) with a
  THB-per-oz line converted at the live FX rate — this is an estimate, not the
  official Thai Gold Traders Association baht-weight price (no free source
  exists for that). "Mutual Fund" covers US funds only (Yahoo has no free
  Thai กองทุนรวม NAV data).
- **Chart history paging**: panning near the earliest loaded bar fetches an
  older page ending right before it (`GET /api/v1/charts/:symbol?...&end=<unix
  seconds>`) and merges it in without resetting zoom; the quick-jump range
  selector still works as a shortcut, it's just no longer the only way to see
  further back.
- **Drawing tools are intentionally scoped down**, not full TradingView parity:
  a trendline (tap two points) and a horizontal line (tap once), kept in the
  chart component's local state only — not persisted or synced across
  devices/sessions.
