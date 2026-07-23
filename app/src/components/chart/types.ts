import type { Candle, ConsolidationZone, OverlaySeries } from "@/types/api";

export interface CandlestickChartProps {
  candles: Candle[];
  overlays?: OverlaySeries;
  consolidationZones?: ConsolidationZone[];
  height?: number;
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
