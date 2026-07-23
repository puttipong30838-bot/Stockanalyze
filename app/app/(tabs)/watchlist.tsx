import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { colors, spacing } from "@/theme/colors";
import { StockRow } from "@/components/common/StockRow";
import { useQuotes } from "@/api/hooks";
import { useSettingsStore } from "@/store/settingsStore";

export default function WatchlistScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const watchlist = useSettingsStore((s) => s.watchlist);
  const quotesQuery = useQuotes(watchlist);

  return (
    <View style={styles.container}>
      {watchlist.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.empty}>{t("common.noData")}</Text>
        </View>
      ) : quotesQuery.isLoading ? (
        <ActivityIndicator color={colors.bullish} style={styles.loader} />
      ) : (
        <FlatList
          data={quotesQuery.data ?? []}
          keyExtractor={(item) => item.symbol}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <StockRow
              quote={item}
              onPress={() => router.push(`/stock/${encodeURIComponent(item.symbol)}`)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg },
  loader: { marginTop: spacing.xl },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { color: colors.textMuted },
});
