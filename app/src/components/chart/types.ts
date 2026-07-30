import type { Candle, ConsolidationZone, OverlaySeries } from "@/types/api";

export interface CandlestickChartProps {
  candles: Candle[];
  overlays?: OverlaySeries;
  consolidationZones?: ConsolidationZone[];
  height?: number;
  /** Called when the user pans near the earliest loaded bar; should resolve
   * to older candles ending just before `beforeUnixSeconds`, or an empty
   * array once there's no more history to load. */
  onLoadMoreHistory?: (beforeUnixSeconds: number) => Promise<Candle[]>;
  /** Extra symbols to overlay as %-change-from-start lines on a separate
   * price scale, for comparing relative performance. */
  compareSeries?: CompareSeriesInput[];
}

/** Merges an older page of candles in front of the currently loaded set,
 * de-duplicating by timestamp and keeping ascending order. */
export function mergeOlderCandles(existing: Candle[], older: Candle[]): Candle[] {
  const existingTimes = new Set(existing.map((c) => c.t));
  const uniqueOlder = older.filter((c) => !existingTimes.has(c.t));
  return [...uniqueOlder.sort((a, b) => a.t - b.t), ...existing];
}

export interface CompareSeriesInput {
  symbol: string;
  color: string;
  points: ChartPoint[];
}

/** Converts a symbol's own candles into a %-change-from-first-close series,
 * so symbols with very different absolute prices can share one overlay. */
export function toPercentChangeSeries(candles: Candle[]): ChartPoint[] {
  if (candles.length === 0) return [];
  const base = candles[0].c;
  if (!base) return [];
  return candles.map((c) => ({ time: c.t, value: ((c.c - base) / base) * 100 }));
}

export interface ChartPoint {
  time: number;
  value: number;
}

export function toLinePoints(
  candles: Candle[],
  series: (number | null)[]
): ChartPoint[] {
  const points: ChartPoint[] = [];
  for (let i = 0; i < candles.length; i++) {
    const value = series[i];
    if (value != null) {
      points.push({ time: candles[i].t, value });
    }
  }
  return points;
}
