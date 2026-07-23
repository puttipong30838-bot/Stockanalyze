import { useEffect, useRef } from "react";
import { View } from "react-native";
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
} from "lightweight-charts";
import { colors } from "@/theme/colors";
import { toLinePoints, type CandlestickChartProps } from "./types";

export function CandlestickChart({
  candles,
  overlays,
  height = 320,
}: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const overlaySeriesRef = useRef<ISeriesApi<"Line">[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      height,
      layout: { background: { color: colors.background }, textColor: colors.textSecondary },
      grid: {
        vertLines: { color: colors.border },
        horzLines: { color: colors.border },
      },
      rightPriceScale: { borderColor: colors.border },
      timeScale: { borderColor: colors.border, timeVisible: true, secondsVisible: false },
    });
    chartRef.current = chart;
    candleSeriesRef.current = chart.addCandlestickSeries({
      upColor: colors.bullish,
      downColor: colors.bearish,
      borderVisible: false,
      wickUpColor: colors.bullish,
      wickDownColor: colors.bearish,
    });

    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      overlaySeriesRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    if (!chart || !candleSeries) return;

    candleSeries.setData(
      candles.map((c) => ({ time: c.t as any, open: c.o, high: c.h, low: c.l, close: c.c }))
    );

    overlaySeriesRef.current.forEach((s) => chart.removeSeries(s));
    overlaySeriesRef.current = [];

    if (overlays) {
      const lines: Array<[string, (number | null)[]]> = [
        [colors.neutral, overlays.sma20],
        [colors.textMuted, overlays.sma50],
      ];
      for (const [color, series] of lines) {
        const points = toLinePoints(candles, series);
        if (points.length === 0) continue;
        const lineSeries = chart.addLineSeries({ color, lineWidth: 1, priceLineVisible: false });
        lineSeries.setData(points.map((p) => ({ time: p.time as any, value: p.value })));
        overlaySeriesRef.current.push(lineSeries);
      }
    }

    chart.timeScale().fitContent();
  }, [candles, overlays]);

  return (
    <View style={{ height, width: "100%" }}>
      <div ref={containerRef} style={{ width: "100%", height }} />
    </View>
  );
}
