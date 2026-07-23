import { useEffect, useRef } from "react";
import { View } from "react-native";
import WebView, { type WebViewMessageEvent } from "react-native-webview";
import { buildChartHtml } from "./chartHtml";
import { toLinePoints, type CandlestickChartProps } from "./types";

// react-native-webview's WebView<P = undefined> collapses WebViewProps & P to
// `never` unless P is pinned to an empty object at the use site.
type ConcreteWebView = WebView<object>;

const CHART_HTML = buildChartHtml();

export function CandlestickChart({
  candles,
  overlays,
  height = 320,
}: CandlestickChartProps) {
  const webviewRef = useRef<ConcreteWebView>(null);
  const readyRef = useRef(false);

  function sendData() {
    const payload = {
      type: "setData",
      candles: candles.map((c) => ({
        time: c.t,
        open: c.o,
        high: c.h,
        low: c.l,
        close: c.c,
      })),
      overlays: overlays
        ? {
            sma20: toLinePoints(candles, overlays.sma20),
            sma50: toLinePoints(candles, overlays.sma50),
            bollingerUpper: toLinePoints(candles, overlays.bollinger.upper),
            bollingerLower: toLinePoints(candles, overlays.bollinger.lower),
          }
        : undefined,
    };
    webviewRef.current?.postMessage(JSON.stringify(payload));
  }

  useEffect(() => {
    if (readyRef.current) sendData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candles, overlays]);

  return (
    <View style={{ height, width: "100%" }}>
      <WebView<object>
        ref={webviewRef}
        originWhitelist={["*"]}
        source={{ html: CHART_HTML }}
        onMessage={(event: WebViewMessageEvent) => {
          try {
            const msg = JSON.parse(event.nativeEvent.data);
            if (msg.type === "ready") {
              readyRef.current = true;
              sendData();
            }
          } catch {
            // ignore malformed messages from the chart webview
          }
        }}
        onLoadEnd={() => {
          if (readyRef.current) sendData();
        }}
        style={{ backgroundColor: "transparent" }}
      />
    </View>
  );
}
