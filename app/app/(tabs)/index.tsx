import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { colors, spacing } from "@/theme/colors";
import { SegmentedToggle } from "@/components/common/SegmentedToggle";
import { StockRow } from "@/components/common/StockRow";
import { useMovers, useSymbols } from "@/api/hooks";
import type { Market } from "@/types/api";

type MarketFilter = Market | "ALL";
type MoverType = "active" | "gainers" | "losers";

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [market, setMarket] = useState<MarketFilter>("ALL");
  const [moverType, setMoverType] = useState<MoverType>("active");
  const [query, setQuery] = useState("");

  const symbolsQuery = useSymbols({ query: query || undefined, market, limit: 100 });
  const moversQuery = useMovers({ market, type: moverType });

  const nameBySymbol = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of symbolsQuery.data ?? []) map.set(s.symbol, s.name);
    return map;
  }, [symbolsQuery.data]);

  const showingSearch = query.trim().length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("home.title")}</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("home.searchPlaceholder")}
          placeholderTextColor={colors.textMuted}
          style={styles.search}
        />
        <View style={styles.filterRow}>
          <SegmentedToggle
            value={market}
            onChange={setMarket}
            options={[
              { value: "ALL", label: t("home.all") },
              { value: "SET", label: t("home.set") },
              { value: "US", label: t("home.us") },
            ]}
          />
        </View>
        {!showingSearch && (
          <View style={styles.filterRow}>
            <SegmentedToggle
              value={moverType}
              onChange={setMoverType}
              options={[
                { value: "active", label: t("home.mostActive") },
                { value: "gainers", label: t("home.gainers") },
                { value: "losers", label: t("home.losers") },
              ]}
            />
          </View>
        )}
      </View>

      {showingSearch ? (
        symbolsQuery.isLoading ? (
          <ActivityIndicator color={colors.bullish} style={styles.loader} />
        ) : (
          <FlatList
            data={symbolsQuery.data ?? []}
            keyExtractor={(item) => item.symbol}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <StockRow
                quote={{
                  symbol: item.symbol,
                  price: null,
                  change: null,
                  changePercent: null,
                  dayHigh: null,
                  dayLow: null,
                  prevClose: null,
                  volume: null,
                }}
                name={item.name}
                onPress={() => router.push(`/stock/${encodeURIComponent(item.symbol)}`)}
              />
            )}
            ListEmptyComponent={<Text style={styles.empty}>{t("common.noData")}</Text>}
          />
        )
      ) : moversQuery.isLoading ? (
        <ActivityIndicator color={colors.bullish} style={styles.loader} />
      ) : (
        <FlatList
          data={moversQuery.data ?? []}
          keyExtractor={(item) => item.symbol}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <StockRow
              quote={item}
              name={nameBySymbol.get(item.symbol)}
              onPress={() => router.push(`/stock/${encodeURIComponent(item.symbol)}`)}
            />
          )}
          ListEmptyComponent={<Text style={styles.empty}>{t("common.noData")}</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "800",
    marginBottom: spacing.xs,
  },
  search: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
  },
  filterRow: {
    flexDirection: "row",
  },
  list: {
    padding: spacing.lg,
  },
  loader: {
    marginTop: spacing.xl,
  },
  empty: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});
