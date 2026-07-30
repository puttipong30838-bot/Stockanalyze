import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Text } from "@/components/common/AppText";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { colors, spacing } from "@/theme/colors";
import { SegmentedToggle } from "@/components/common/SegmentedToggle";
import { CategoryChips } from "@/components/common/CategoryChips";
import { StockRow } from "@/components/common/StockRow";
import { useMovers, useQuotes, useSymbols } from "@/api/hooks";
import type { Market } from "@/types/api";

type MarketFilter = Market | "ALL";
type MoverType = "market_cap" | "active" | "gainers" | "losers";

function sortByMarketCapDesc<T extends { symbol: string; marketCap: number | null }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0));
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [market, setMarket] = useState<MarketFilter>("ALL");
  const [moverType, setMoverType] = useState<MoverType>("market_cap");
  const [query, setQuery] = useState("");

  const symbolsQuery = useSymbols({ query: query || undefined, market, limit: 100 });
  const moversQuery = useMovers({ market, type: moverType });

  const showingSearch = query.trim().length > 0;

  const searchSymbols = useMemo(
    () => (symbolsQuery.data ?? []).map((s) => s.symbol),
    [symbolsQuery.data]
  );
  const searchQuotesQuery = useQuotes(showingSearch ? searchSymbols : []);

  const nameBySymbol = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of symbolsQuery.data ?? []) map.set(s.symbol, s.name);
    return map;
  }, [symbolsQuery.data]);

  const sortedSearchResults = useMemo(
    () => sortByMarketCapDesc(searchQuotesQuery.data ?? []),
    [searchQuotesQuery.data]
  );

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
        <CategoryChips
          value={market}
          onChange={setMarket}
          options={[
            { value: "ALL", label: t("home.all") },
            { value: "SET", label: t("home.set") },
            { value: "US", label: t("home.us") },
            { value: "CRYPTO", label: t("home.crypto") },
            { value: "COMMODITY", label: t("home.commodity") },
            { value: "FUND", label: t("home.fund") },
          ]}
        />
        {!showingSearch && (
          <View style={styles.filterRow}>
            <SegmentedToggle
              value={moverType}
              onChange={setMoverType}
              options={[
                { value: "market_cap", label: t("home.topMarketCap") },
                { value: "active", label: t("home.mostActive") },
                { value: "gainers", label: t("home.gainers") },
                { value: "losers", label: t("home.losers") },
              ]}
            />
          </View>
        )}
      </View>

      {showingSearch ? (
        symbolsQuery.isLoading || searchQuotesQuery.isLoading ? (
          <ActivityIndicator color={colors.accent} style={styles.loader} />
        ) : (
          <FlatList
            data={sortedSearchResults}
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
        )
      ) : moversQuery.isLoading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
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
