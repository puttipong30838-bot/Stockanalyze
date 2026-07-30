import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import WebView, { type WebViewMessageEvent } from "react-native-webview";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { buildChartHtml } from "./chartHtml";
import { ChartToolbar, type DrawMode } from "./ChartToolbar";
import { mergeOlderCandles, toLinePoints, type CandlestickChartProps } from "./types";
import type { Candle } from "@/types/api";

// react-native-webview's WebView<P = undefined> collapses WebViewProps & P to
// `never` unless P is pinned to an empty object at the use site.
type ConcreteWebView = WebView<object>;

const CHART_HTML = buildChartHtml();

export function CandlestickChart({
  candles,
  overlays,
  height = 320,
  onLoadMoreHistory,
  compareSeries,
}: CandlestickChartProps) {
  const webviewRef = useRef<ConcreteWebView>(null);
  const containerRef = useRef<View>(null);
  const readyRef = useRef(false);
  const mergedRef = useRef<Candle[]>(candles);
  const loadingRef = useRef(false);
  const noMoreRef = useRef(false);
  const [drawMode, setDrawModeState] = useState<DrawMode>("none");

  function sendInitial() {
    mergedRef.current = candles;
    loadingRef.current = false;
    noMoreRef.current = false;
    const payload: Record<string, unknown> = {
      type: "setData",
      candles: candles.map((c) => ({ time: c.t, open: c.o, high: c.h, low: c.l, close: c.c })),
    };
    if (overlays) {
      payload.overlays = {
        sma20: toLinePoints(candles, overlays.sma20),
        sma50: toLinePoints(candles, overlays.sma50),
        bollingerUpper: toLinePoints(candles, overlays.bollinger.upper),
        bollingerLower: toLinePoints(candles, overlays.bollinger.lower),
      };
    }
    if (compareSeries) {
      payload.compareSeries = compareSeries;
    }
    webviewRef.current?.postMessage(JSON.stringify(payload));
  }

  useEffect(() => {
    if (readyRef.current) sendInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candles, overlays, compareSeries]);

  async function handleRequestMoreHistory() {
    if (!onLoadMoreHistory || loadingRef.current || noMoreRef.current) return;
    const earliest = mergedRef.current[0]?.t;
    if (earliest == null) return;
    loadingRef.current = true;
    try {
      const older = await onLoadMoreHistory(earliest);
      if (!older || older.length === 0) {
        noMoreRef.current = true;
        webviewRef.current?.postMessage(JSON.stringify({ type: "noMoreHistory" }));
        return;
      }
      const merged = mergeOlderCandles(mergedRef.current, older);
      mergedRef.current = merged;
      webviewRef.current?.postMessage(
        JSON.stringify({
          type: "setData",
          preserveView: true,
          candles: merged.map((c) => ({ time: c.t, open: c.o, high: c.h, low: c.l, close: c.c })),
        })
      );
    } finally {
      loadingRef.current = false;
    }
  }

  function handleSetDrawMode(mode: DrawMode) {
    setDrawModeState(mode);
    webviewRef.current?.postMessage(JSON.stringify({ type: "setDrawMode", mode }));
  }

  function handleClearDrawings() {
    setDrawModeState("none");
    webviewRef.current?.postMessage(JSON.stringify({ type: "clearDrawings" }));
  }

  async function handleShare() {
    try {
      const uri = await captureRef(containerRef, { format: "png", quality: 0.9 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      }
    } catch {
      // best-effort; sharing isn't on the critical path
    }
  }

  return (
    <View>
      <ChartToolbar
        drawMode={drawMode}
        onSetDrawMode={handleSetDrawMode}
        onClear={handleClearDrawings}
        onShare={handleShare}
      />
      <View ref={containerRef} collapsable={false} style={{ height, width: "100%" }}>
        <WebView<object>
          ref={webviewRef}
          originWhitelist={["*"]}
          source={{ html: CHART_HTML }}
          onMessage={(event: WebViewMessageEvent) => {
            try {
              const msg = JSON.parse(event.nativeEvent.data);
              if (msg.type === "ready") {
                readyRef.current = true;
                sendInitial();
              } else if (msg.type === "requestMoreHistory") {
                void handleRequestMoreHistory();
              } else if (msg.type === "drawingComplete") {
                setDrawModeState("none");
              }
            } catch {
              // ignore malformed messages from the chart webview
            }
          }}
          onLoadEnd={() => {
            if (readyRef.current) sendInitial();
          }}
          style={{ backgroundColor: "transparent" }}
        />
      </View>
    </View>
  );
}
