import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "@/components/common/AppText";
import { Stack, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { colors, spacing } from "@/theme/colors";
import { CandlestickChart } from "@/components/chart/CandlestickChart";
import { AnalysisPanel } from "@/components/analysis/AnalysisPanel";
import { NewsListItem } from "@/components/news/NewsListItem";
import { RangeBar } from "@/components/common/RangeBar";
import { RangeSelector, RANGE_CONFIG, type RangeKey } from "@/components/common/RangeSelector";
import { useAnalysis, useChart, useFx, useNews, useQuotes } from "@/api/hooks";
import { useSettingsStore } from "@/store/settingsStore";

function formatMoney(value: number, currency: string): string {
  const symbol = currency === "THB" ? "฿" : currency === "USD" ? "$" : `${currency} `;
  return `${symbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function StockDetailScreen() {
  const { symbol: rawSymbol } = useLocalSearchParams<{ symbol: string }>();
  const symbol = decodeURIComponent(rawSymbol ?? "");
  const { t } = useTranslation();

  const mode = useSettingsStore((s) => s.mode);
  const newsLanguage = useSettingsStore((s) => s.newsLanguage);
  const watchlist = useSettingsStore((s) => s.watchlist);
  const toggleWatchlist = useSettingsStore((s) => s.toggleWatchlist);
  const displayCurrency = useSettingsStore((s) => s.displayCurrency);
  const inWatchlist = watchlist.includes(symbol);

  const [rangeKey, setRangeKey] = useState<RangeKey>(mode === "trader" ? "1D" : "6M");
  const { interval, range } = useMemo(() => RANGE_CONFIG[rangeKey], [rangeKey]);

  const quoteQuery = useQuotes([symbol], 10_000);
  const chartQuery = useChart(symbol, interval, range);
  const analysisQuery = useAnalysis(symbol, mode, 30_000);
  const newsQuery = useNews({ symbol, lang: newsLanguage, limit: 10 });
  const fxQuery = useFx();

  const quote = quoteQuery.data?.[0];
  const isUp = (quote?.changePercent ?? 0) >= 0;
  const usdThb = fxQuery.data?.usdThb;
  const nativeCurrency = quote?.currency ?? "";

  const convertedPrice = useMemo(() => {
    if (!quote?.price || !usdThb) return null;
    if (nativeCurrency === "THB") return { value: quote.price / usdThb, currency: "USD" };
    if (nativeCurrency === "USD") return { value: quote.price * usdThb, currency: "THB" };
    return null;
  }, [quote, usdThb, nativeCurrency]);

  // Show the user's preferred currency as the large primary price when we
  // have a conversion for it; otherwise fall back to the stock's own currency.
  const showConvertedAsPrimary = convertedPrice?.currency === displayCurrency;
  const primaryPrice = showConvertedAsPrimary ? convertedPrice.value : quote?.price ?? null;
  const primaryCurrency = showConvertedAsPrimary ? displayCurrency : nativeCurrency;
  const secondaryPriceValue = showConvertedAsPrimary ? quote?.price ?? null : convertedPrice?.value ?? null;
  const secondaryPriceCurrency = showConvertedAsPrimary ? nativeCurrency : convertedPrice?.currency;
  const secondaryPrice =
    secondaryPriceValue != null && secondaryPriceCurrency
      ? formatMoney(secondaryPriceValue, secondaryPriceCurrency)
      : null;

  // Mode-specific framing: investors care where price sits in its 52-week
  // range, traders care where it sits within today's session range.
  const flairKey = useMemo(() => {
    if (!quote?.price) return null;
    if (mode === "investor") {
      const { fiftyTwoWeekLow: low, fiftyTwoWeekHigh: high, price } = quote;
      if (low == null || high == null || high === low) return "mid";
      const pct = (price - low) / (high - low);
      if (pct <= 0.3) return "accumulate";
      if (pct >= 0.85) return "distribute";
      return "mid";
    }
    const { dayLow: low, dayHigh: high, price } = quote;
    if (low == null || high == null || high === low) return "rangeMid";
    const pct = (price - low) / (high - low);
    if (pct <= 0.25) return "rangeLow";
    if (pct >= 0.75) return "rangeHigh";
    return "rangeMid";
  }, [mode, quote]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: symbol }} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.symbol}>{symbol}</Text>
          {quote && (
            <>
              <View style={styles.priceRow}>
                <Text style={styles.price}>
                  {primaryPrice != null ? formatMoney(primaryPrice, primaryCurrency) : "-"}
                </Text>
                <Text style={[styles.change, { color: isUp ? colors.bullish : colors.bearish }]}>
                  {isUp ? "+" : ""}
                  {quote.changePercent?.toFixed(2) ?? "0.00"}%
                </Text>
              </View>
              {secondaryPrice && <Text style={styles.secondaryPrice}>≈ {secondaryPrice}</Text>}
            </>
          )}
        </View>
        <Pressable onPress={() => toggleWatchlist(symbol)} style={styles.watchButton}>
          <Text style={styles.watchButtonText}>
            {inWatchlist ? t("stock.removeFromWatchlist") : t("stock.addToWatchlist")}
          </Text>
        </Pressable>
      </View>

      {flairKey && (
        <View style={styles.flairChip}>
          <Text style={styles.flairLabel}>{t(`mode.${mode}`)}</Text>
          <Text style={styles.flairText}>{t(`stock.flair.${mode}.${flairKey}`)}</Text>
        </View>
      )}

      {quote && (
        <View style={styles.rangesBlock}>
          <RangeBar
            label={t("stock.dayRange")}
            low={quote.dayLow}
            high={quote.dayHigh}
            value={quote.price}
            formatValue={(n) => formatMoney(n, quote.currency ?? "")}
          />
          <RangeBar
            label={t("stock.fiftyTwoWeekRange")}
            low={quote.fiftyTwoWeekLow}
            high={quote.fiftyTwoWeekHigh}
            value={quote.price}
            formatValue={(n) => formatMoney(n, quote.currency ?? "")}
          />
        </View>
      )}

      <RangeSelector value={rangeKey} onChange={setRangeKey} />

      {chartQuery.isLoading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : chartQuery.data ? (
        <CandlestickChart
          candles={chartQuery.data.candles}
          overlays={chartQuery.data.overlays}
          height={300}
        />
      ) : (
        <Text style={styles.empty}>{t("common.noData")}</Text>
      )}

      {analysisQuery.isLoading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : analysisQuery.data ? (
        <AnalysisPanel analysis={analysisQuery.data} />
      ) : (
        <Text style={styles.empty}>{t("common.noData")}</Text>
      )}

      <Text style={styles.sectionTitle}>{t("stock.news")}</Text>
      {newsQuery.isLoading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : (
        (newsQuery.data?.articles ?? []).map((article) => (
          <NewsListItem key={article.id} article={article} />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  headerLeft: { flex: 1 },
  symbol: { color: colors.textPrimary, fontSize: 22, fontWeight: "800" },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: spacing.sm, marginTop: spacing.xs },
  price: { color: colors.textPrimary, fontSize: 20, fontWeight: "700" },
  change: { fontSize: 14, fontWeight: "600" },
  secondaryPrice: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  watchButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  watchButtonText: { color: colors.accent, fontSize: 12, fontWeight: "700" },
  flairChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.accentMuted,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  flairLabel: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  flairText: {
    color: colors.textSecondary,
    fontSize: 12,
    flex: 1,
  },
  rangesBlock: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  loader: { marginVertical: spacing.xl },
  empty: { color: colors.textMuted, textAlign: "center", marginVertical: spacing.xl },
});
