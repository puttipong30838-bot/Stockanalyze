import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { colors, spacing } from "@/theme/colors";
import { CandlestickChart } from "@/components/chart/CandlestickChart";
import { AnalysisPanel } from "@/components/analysis/AnalysisPanel";
import { NewsListItem } from "@/components/news/NewsListItem";
import { useAnalysis, useChart, useNews, useQuotes } from "@/api/hooks";
import { useSettingsStore } from "@/store/settingsStore";

export default function StockDetailScreen() {
  const { symbol: rawSymbol } = useLocalSearchParams<{ symbol: string }>();
  const symbol = decodeURIComponent(rawSymbol ?? "");
  const { t } = useTranslation();

  const mode = useSettingsStore((s) => s.mode);
  const newsLanguage = useSettingsStore((s) => s.newsLanguage);
  const watchlist = useSettingsStore((s) => s.watchlist);
  const toggleWatchlist = useSettingsStore((s) => s.toggleWatchlist);
  const inWatchlist = watchlist.includes(symbol);

  const { interval, range } = useMemo(
    () => (mode === "trader" ? { interval: "5m", range: "1d" } : { interval: "1d", range: "6mo" }),
    [mode]
  );

  const quoteQuery = useQuotes([symbol]);
  const chartQuery = useChart(symbol, interval, range);
  const analysisQuery = useAnalysis(symbol, mode);
  const newsQuery = useNews({ symbol, lang: newsLanguage, limit: 10 });

  const quote = quoteQuery.data?.[0];
  const isUp = (quote?.changePercent ?? 0) >= 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: symbol }} />

      <View style={styles.header}>
        <View>
          <Text style={styles.symbol}>{symbol}</Text>
          {quote && (
            <View style={styles.priceRow}>
              <Text style={styles.price}>{quote.price?.toFixed(2) ?? "-"}</Text>
              <Text style={[styles.change, { color: isUp ? colors.bullish : colors.bearish }]}>
                {isUp ? "+" : ""}
                {quote.changePercent?.toFixed(2) ?? "0.00"}%
              </Text>
            </View>
          )}
        </View>
        <Pressable onPress={() => toggleWatchlist(symbol)} style={styles.watchButton}>
          <Text style={styles.watchButtonText}>
            {inWatchlist ? t("stock.removeFromWatchlist") : t("stock.addToWatchlist")}
          </Text>
        </Pressable>
      </View>

      {chartQuery.isLoading ? (
        <ActivityIndicator color={colors.bullish} style={styles.loader} />
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
        <ActivityIndicator color={colors.bullish} style={styles.loader} />
      ) : analysisQuery.data ? (
        <AnalysisPanel analysis={analysisQuery.data} />
      ) : (
        <Text style={styles.empty}>{t("common.noData")}</Text>
      )}

      <Text style={styles.sectionTitle}>{t("stock.news")}</Text>
      {newsQuery.isLoading ? (
        <ActivityIndicator color={colors.bullish} style={styles.loader} />
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
  symbol: { color: colors.textPrimary, fontSize: 22, fontWeight: "800" },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: spacing.sm, marginTop: spacing.xs },
  price: { color: colors.textPrimary, fontSize: 20, fontWeight: "700" },
  change: { fontSize: 14, fontWeight: "600" },
  watchButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  watchButtonText: { color: colors.bullish, fontSize: 12, fontWeight: "700" },
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
