import type { Candle } from "../src/types/index.js";

export function makeTrendingCandles(
  count: number,
  startPrice: number,
  driftPerBar: number,
  opts: { volume?: number; volatility?: number } = {}
): Candle[] {
  const { volume = 100_000, volatility = 0.2 } = opts;
  const candles: Candle[] = [];
  let price = startPrice;
  const startT = Math.floor(Date.now() / 1000) - count * 86400;

  for (let i = 0; i < count; i++) {
    const open = price;
    const close = open + driftPerBar + (Math.random() - 0.5) * volatility;
    const high = Math.max(open, close) + Math.random() * volatility;
    const low = Math.min(open, close) - Math.random() * volatility;
    candles.push({
      t: startT + i * 86400,
      o: open,
      h: high,
      l: low,
      c: close,
      v: volume,
    });
    price = close;
  }
  return candles;
}

export function makeFlatCandles(
  count: number,
  price: number,
  rangePct: number,
  volume = 50_000
): Candle[] {
  const candles: Candle[] = [];
  const startT = Math.floor(Date.now() / 1000) - count * 86400;
  for (let i = 0; i < count; i++) {
    const jitter = price * rangePct * (Math.random() - 0.5);
    const o = price + jitter;
    const c = price - jitter;
    const h = Math.max(o, c) + price * rangePct * 0.1;
    const l = Math.min(o, c) - price * rangePct * 0.1;
    candles.push({ t: startT + i * 86400, o, h, l, c, v: volume });
  }
  return candles;
}
