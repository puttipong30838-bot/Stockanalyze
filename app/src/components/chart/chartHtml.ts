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
      var compareSeriesMap = {};
      var zoneRectangles = [];
      var lastCandleCount = 0;
      var loadingMore = false;
      var noMoreHistory = false;
      var drawMode = 'none';
      var pendingTrendlinePoint = null;
      var drawnLineSeries = [];
      var drawnPriceLines = [];

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
        chart.timeScale().subscribeVisibleLogicalRangeChange(function (range) {
          if (!range || loadingMore || noMoreHistory) return;
          if (range.from < 10) {
            loadingMore = true;
            post({ type: 'requestMoreHistory' });
          }
        });
        chart.subscribeClick(function (param) {
          if (drawMode === 'none' || !param.point || param.time == null) return;
          var price = candleSeries.coordinateToPrice(param.point.y);
          if (price == null) return;
          if (drawMode === 'hline') {
            var priceLine = candleSeries.createPriceLine({
              price: price,
              color: '${colors.accent}',
              lineWidth: 1,
              lineStyle: LightweightCharts.LineStyle.Dashed,
              axisLabelVisible: true,
            });
            drawnPriceLines.push(priceLine);
            drawMode = 'none';
            post({ type: 'drawingComplete' });
          } else if (drawMode === 'trendline') {
            if (!pendingTrendlinePoint) {
              pendingTrendlinePoint = { time: param.time, value: price };
            } else {
              var series = chart.addLineSeries({
                color: '${colors.accent}',
                lineWidth: 2,
                priceLineVisible: false,
                lastValueVisible: false,
              });
              series.setData([pendingTrendlinePoint, { time: param.time, value: price }]);
              drawnLineSeries.push(series);
              pendingTrendlinePoint = null;
              drawMode = 'none';
              post({ type: 'drawingComplete' });
            }
          }
        });
        post({ type: 'ready' });
      }

      function clearDrawings() {
        drawnLineSeries.forEach(function (s) { chart.removeSeries(s); });
        drawnLineSeries = [];
        drawnPriceLines.forEach(function (pl) { candleSeries.removePriceLine(pl); });
        drawnPriceLines = [];
        drawMode = 'none';
        pendingTrendlinePoint = null;
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

      function clearCompareSeries() {
        Object.keys(compareSeriesMap).forEach(function (key) {
          chart.removeSeries(compareSeriesMap[key]);
        });
        compareSeriesMap = {};
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
          var prevCount = lastCandleCount;
          var prependedCount = msg.preserveView ? msg.candles.length - prevCount : 0;
          var prevRange = msg.preserveView ? chart.timeScale().getVisibleLogicalRange() : null;

          candleSeries.setData(msg.candles);
          lastCandleCount = msg.candles.length;

          // Overlay series are keyed by their own time values, so history
          // paging (which omits overlays) can safely leave them untouched.
          if (msg.overlays) {
            clearOverlays();
            if (msg.overlays.sma20) setOverlayLine('sma20', '${colors.neutral}', msg.overlays.sma20);
            if (msg.overlays.sma50) setOverlayLine('sma50', '${colors.textMuted}', msg.overlays.sma50);
            if (msg.overlays.bollingerUpper) setOverlayLine('bbUpper', '${colors.textMuted}', msg.overlays.bollingerUpper);
            if (msg.overlays.bollingerLower) setOverlayLine('bbLower', '${colors.textMuted}', msg.overlays.bollingerLower);
          }

          if (!msg.preserveView) {
            clearCompareSeries();
            if (msg.compareSeries && msg.compareSeries.length > 0) {
              msg.compareSeries.forEach(function (cs) {
                var series = chart.addLineSeries({
                  color: cs.color,
                  lineWidth: 2,
                  priceScaleId: 'compare',
                  priceLineVisible: false,
                });
                series.setData(cs.points);
                compareSeriesMap[cs.symbol] = series;
              });
              chart.priceScale('compare').applyOptions({
                scaleMargins: { top: 0.1, bottom: 0.1 },
              });
            }
          }

          if (msg.preserveView && prevRange && prependedCount > 0) {
            chart.timeScale().setVisibleLogicalRange({
              from: prevRange.from + prependedCount,
              to: prevRange.to + prependedCount,
            });
          } else if (!msg.preserveView) {
            // A non-paging setData means a fresh symbol/range load: allow
            // history paging to start over for the new dataset.
            noMoreHistory = false;
            chart.timeScale().fitContent();
          }
          loadingMore = false;
        } else if (msg.type === 'noMoreHistory') {
          noMoreHistory = true;
          loadingMore = false;
        } else if (msg.type === 'setDrawMode') {
          drawMode = msg.mode;
          pendingTrendlinePoint = null;
        } else if (msg.type === 'clearDrawings') {
          clearDrawings();
        }
      }

      ensureChart();
    </script>
  </body>
</html>`;
}
