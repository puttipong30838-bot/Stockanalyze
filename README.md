# StockPulse

Mobile stock analysis app (SET, US, crypto, commodities, US mutual funds) with
charts, heuristic technical/news analysis, and bilingual (Thai/English) text-to-speech
news reading. Green-on-black theme, Inter/Noto Sans Thai typography. Built with a
free/keyless data stack — no paid API keys required.

## Structure

- `server/` — Fastify + TypeScript API. Fetches quotes/charts from Yahoo Finance
  (unofficial, free) and news from Google News RSS, computes all technical
  indicators and heuristic analysis (trend, volatility, volume, institutional-demand
  proxy, consolidation zones, pattern detection, sentiment, AI plan/hold/summary
  including Strong Buy/Strong Sell tiers), plus a live USD/THB FX rate.
- `app/` — Expo (React Native) app. Browse stocks/crypto/commodities/funds via
  category chips, view candlestick charts (TradingView `lightweight-charts`) with a
  1D/5D/1M/6M/YTD/1Y/5Y range selector, day-range and 52-week-range bars, a full
  analysis panel, news with topic filters and TTS, watchlist, Investor/Trader mode
  toggle, Thai/English UI.

## Running it

### 1. Backend

```
cd server
npm install
npm run dev        # starts on http://localhost:4000
npm test           # runs the offline unit/route test suite
```

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
- The symbol list is a curated seed list (`server/src/data/symbols.seed.json`,
  ~290 instruments across SET/US/crypto/commodities/funds), not a full live
  exchange listing — there's no free endpoint for that.
- "Gold" is the international spot price (USD/oz, via Yahoo `GC=F`) with a
  THB-per-oz line converted at the live FX rate — this is an estimate, not the
  official Thai Gold Traders Association baht-weight price (no free source
  exists for that). "Mutual Fund" covers US funds only (Yahoo has no free
  Thai กองทุนรวม NAV data).
