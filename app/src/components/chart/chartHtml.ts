import { colors } from "@/theme/colors";

const LIGHTWEIGHT_CHARTS_CDN_URL =
  "https://unpkg.com/lightweight-charts@4.1.3/dist/lightweight-charts.standalone.production.js";

/**
 * Pinned to lightweight-charts v4's addCandlestickSeries/addLineSeries API
 * (v5 changed to a single addSeries(SeriesType, options) call) so this HTML
 * doesn't silently break if "latest" ships a new major version.
 * Requires the device to have internet access to load the CDN script.
 */
export function buildChartHtml(): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <style>
      html, body, #chart { margin: 0; padding: 0; width: 100%; height: 100%; background: ${colors.background}; }
    </style>
  </head>
  <body>
    <div id="chart"></div>
    <script src="${LIGHTWEIGHT_CHARTS_CDN_URL}"></script>
    <script>
      var chart = null;
      var candleSeries = null;
      var overlaySeriesMap = {};
      var zoneRectangles = [];

      function post(msg) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(msg));
        }
      }

      function ensureChart() {
        if (chart) return;
        chart = LightweightCharts.createChart(document.getElementById('chart'), {
          layout: {
            background: { color: '${colors.background}' },
            textColor: '${colors.textSecondary}',
          },
          grid: {
            vertLines: { color: '${colors.border}' },
            horzLines: { color: '${colors.border}' },
          },
          rightPriceScale: { borderColor: '${colors.border}' },
          timeScale: { borderColor: '${colors.border}', timeVisible: true, secondsVisible: false },
        });
        candleSeries = chart.addCandlestickSeries({
          upColor: '${colors.bullish}',
          downColor: '${colors.bearish}',
          borderVisible: false,
          wickUpColor: '${colors.bullish}',
          wickDownColor: '${colors.bearish}',
        });
        post({ type: 'ready' });
      }

      function clearOverlays() {
        Object.keys(overlaySeriesMap).forEach(function (key) {
          chart.removeSeries(overlaySeriesMap[key]);
        });
        overlaySeriesMap = {};
      }

      function setOverlayLine(key, color, points) {
        var series = chart.addLineSeries({ color: color, lineWidth: 1, priceLineVisible: false });
        series.setData(points);
        overlaySeriesMap[key] = series;
      }

      window.addEventListener('message', function (event) {
        handleMessage(event.data);
      });
      document.addEventListener('message', function (event) {
        handleMessage(event.data);
      });

      function handleMessage(raw) {
        var msg;
        try { msg = JSON.parse(raw); } catch (e) { return; }
        if (msg.type === 'setData') {
          ensureChart();
          candleSeries.setData(msg.candles);
          clearOverlays();
          if (msg.overlays) {
            if (msg.overlays.sma20) setOverlayLine('sma20', '${colors.neutral}', msg.overlays.sma20);
            if (msg.overlays.sma50) setOverlayLine('sma50', '${colors.textMuted}', msg.overlays.sma50);
            if (msg.overlays.bollingerUpper) setOverlayLine('bbUpper', '${colors.textMuted}', msg.overlays.bollingerUpper);
            if (msg.overlays.bollingerLower) setOverlayLine('bbLower', '${colors.textMuted}', msg.overlays.bollingerLower);
          }
          chart.timeScale().fitContent();
        }
      }

      ensureChart();
    </script>
  </body>
</html>`;
}
