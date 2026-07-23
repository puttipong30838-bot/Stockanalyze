import { fetchChart, fetchQuotes, searchSymbols } from "../src/providers/yahoo.js";
import { fetchNews } from "../src/providers/news.js";

async function main() {
  console.log("--- quotes ---");
  console.log(await fetchQuotes(["AAPL", "PTT.BK"]));

  console.log("--- chart (AAPL, 1d, 5y->1mo) ---");
  const candles = await fetchChart("AAPL", "1d", "1mo");
  console.log(`got ${candles.length} candles, last:`, candles[candles.length - 1]);

  console.log("--- search ---");
  console.log(await searchSymbols("Apple"));

  console.log("--- news (en) ---");
  const news = await fetchNews("Apple Inc", "en", 3);
  console.log(news);
}

main().catch((err) => {
  console.error("SMOKE TEST FAILED", err);
  process.exit(1);
});
