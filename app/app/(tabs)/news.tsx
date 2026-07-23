import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { colors, spacing } from "@/theme/colors";
import { NewsListItem } from "@/components/news/NewsListItem";
import { useNews } from "@/api/hooks";
import { useSettingsStore } from "@/store/settingsStore";

export default function NewsScreen() {
  const { t } = useTranslation();
  const newsLanguage = useSettingsStore((s) => s.newsLanguage);
  const newsQuery = useNews({ lang: newsLanguage, limit: 30 });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("news.title")}</Text>
      {newsQuery.isLoading ? (
        <ActivityIndicator color={colors.bullish} style={styles.loader} />
      ) : (
        <FlatList
          data={newsQuery.data?.articles ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <NewsListItem article={item} />}
          ListEmptyComponent={<Text style={styles.empty}>{t("common.noData")}</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "800",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  list: { padding: spacing.lg },
  loader: { marginTop: spacing.xl },
  empty: { color: colors.textMuted, textAlign: "center", marginTop: spacing.xl },
});
