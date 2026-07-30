import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import {
  LineStyle,
  createChart,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
} from "lightweight-charts";
import { colors } from "@/theme/colors";
import { ChartToolbar, type DrawMode } from "./ChartToolbar";
import { mergeOlderCandles, toLinePoints, type CandlestickChartProps } from "./types";
import type { Candle } from "@/types/api";

export function CandlestickChart({
  candles,
  overlays,
  height = 320,
  onLoadMoreHistory,
  compareSeries,
}: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const overlaySeriesRef = useRef<ISeriesApi<"Line">[]>([]);
  const compareSeriesRef = useRef<ISeriesApi<"Line">[]>([]);
  const drawnLineSeriesRef = useRef<ISeriesApi<"Line">[]>([]);
  const drawnPriceLinesRef = useRef<IPriceLine[]>([]);
  const mergedRef = useRef<Candle[]>(candles);
  const loadingRef = useRef(false);
  const noMoreRef = useRef(false);
  const onLoadMoreHistoryRef = useRef(onLoadMoreHistory);
  onLoadMoreHistoryRef.current = onLoadMoreHistory;
  const drawModeRef = useRef<DrawMode>("none");
  const pendingTrendlinePointRef = useRef<{ time: number; value: number } | null>(null);
  const [drawMode, setDrawModeState] = useState<DrawMode>("none");

  async function handleRequestMoreHistory() {
    const onLoadMore = onLoadMoreHistoryRef.current;
    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    if (!onLoadMore || !chart || !candleSeries || loadingRef.current || noMoreRef.current) return;
    const earliest = mergedRef.current[0]?.t;
    if (earliest == null) return;
    loadingRef.current = true;
    try {
      const older = await onLoadMore(earliest);
      if (!older || older.length === 0) {
        noMoreRef.current = true;
        return;
      }
      const merged = mergeOlderCandles(mergedRef.current, older);
      const prependedCount = merged.length - mergedRef.current.length;
      mergedRef.current = merged;
      const prevRange = chart.timeScale().getVisibleLogicalRange();
      candleSeries.setData(
        merged.map((c) => ({ time: c.t as any, open: c.o, high: c.h, low: c.l, close: c.c }))
      );
      if (prevRange && prependedCount > 0) {
        chart.timeScale().setVisibleLogicalRange({
          from: prevRange.from + prependedCount,
          to: prevRange.to + prependedCount,
        });
      }
    } finally {
      loadingRef.current = false;
    }
  }

  function clearDrawings() {
    const chart = chartRef.current;
    if (!chart) return;
    drawnLineSeriesRef.current.forEach((s) => chart.removeSeries(s));
    drawnLineSeriesRef.current = [];
    const candleSeries = candleSeriesRef.current;
    if (candleSeries) {
      drawnPriceLinesRef.current.forEach((pl) => candleSeries.removePriceLine(pl));
    }
    drawnPriceLinesRef.current = [];
    pendingTrendlinePointRef.current = null;
  }

  function handleSetDrawMode(mode: DrawMode) {
    drawModeRef.current = mode;
    pendingTrendlinePointRef.current = null;
    setDrawModeState(mode);
  }

  function handleClearDrawings() {
    clearDrawings();
    handleSetDrawMode("none");
  }

  function handleShare() {
    const chart = chartRef.current;
    if (!chart) return;
    const canvas = chart.takeScreenshot();
    canvas.toBlob((blob) => {
      if (!blob) return;
      const nav = navigator as Navigator & {
        canShare?: (data: { files: File[] }) => boolean;
        share?: (data: { files: File[] }) => Promise<void>;
      };
      const file = new File([blob], "stockpulse-chart.png", { type: "image/png" });
      if (nav.canShare?.({ files: [file] }) && nav.share) {
        nav.share({ files: [file] }).catch(() => {});
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "stockpulse-chart.png";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

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
    chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (!range || loadingRef.current || noMoreRef.current) return;
      if (range.from < 10) {
        void handleRequestMoreHistory();
      }
    });
    chart.subscribeClick((param) => {
      const candleSeries = candleSeriesRef.current;
      if (drawModeRef.current === "none" || !param.point || param.time == null || !candleSeries) return;
      const price = candleSeries.coordinateToPrice(param.point.y);
      if (price == null) return;
      const time = param.time as unknown as number;
      if (drawModeRef.current === "hline") {
        const priceLine = candleSeries.createPriceLine({
          price,
          color: colors.accent,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: "",
        });
        drawnPriceLinesRef.current.push(priceLine);
        handleSetDrawMode("none");
      } else if (drawModeRef.current === "trendline") {
        if (!pendingTrendlinePointRef.current) {
          pendingTrendlinePointRef.current = { time, value: price };
        } else {
          const lineSeries = chart.addLineSeries({
            color: colors.accent,
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          lineSeries.setData([
            { time: pendingTrendlinePointRef.current.time as any, value: pendingTrendlinePointRef.current.value },
            { time: time as any, value: price },
          ]);
          drawnLineSeriesRef.current.push(lineSeries);
          pendingTrendlinePointRef.current = null;
          handleSetDrawMode("none");
        }
      }
    });

    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      overlaySeriesRef.current = [];
      compareSeriesRef.current = [];
      drawnLineSeriesRef.current = [];
      drawnPriceLinesRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    if (!chart || !candleSeries) return;

    mergedRef.current = candles;
    loadingRef.current = false;
    noMoreRef.current = false;

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

    compareSeriesRef.current.forEach((s) => chart.removeSeries(s));
    compareSeriesRef.current = [];
    if (compareSeries && compareSeries.length > 0) {
      for (const cs of compareSeries) {
        const lineSeries = chart.addLineSeries({
          color: cs.color,
          lineWidth: 2,
          priceScaleId: "compare",
          priceLineVisible: false,
        });
        lineSeries.setData(cs.points.map((p) => ({ time: p.time as any, value: p.value })));
        compareSeriesRef.current.push(lineSeries);
      }
      chart.priceScale("compare").applyOptions({ scaleMargins: { top: 0.1, bottom: 0.1 } });
    }

    chart.timeScale().fitContent();
  }, [candles, overlays, compareSeries]);

  return (
    <View>
      <ChartToolbar
        drawMode={drawMode}
        onSetDrawMode={handleSetDrawMode}
        onClear={handleClearDrawings}
        onShare={handleShare}
      />
      <View style={{ height, width: "100%" }}>
        <div ref={containerRef} style={{ width: "100%", height }} />
      </View>
    </View>
  );
}
