import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { Text } from "@/components/common/AppText";
import { useTranslation } from "react-i18next";
import { colors, spacing } from "@/theme/colors";
import { NewsListItem } from "@/components/news/NewsListItem";
import { CategoryChips } from "@/components/common/CategoryChips";
import { useNews } from "@/api/hooks";
import { useSettingsStore } from "@/store/settingsStore";

export default function NewsScreen() {
  const { t } = useTranslation();
  const newsLanguage = useSettingsStore((s) => s.newsLanguage);
  const newsQuery = useNews({ lang: newsLanguage, limit: 30 });
  const [topic, setTopic] = useState("all");

  const articles = newsQuery.data?.articles ?? [];

  const topicOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const article of articles) {
      for (const t of article.topics) seen.add(t);
    }
    return [
      { value: "all", label: t("news.allTopics") },
      ...Array.from(seen).map((value) => ({
        value,
        label: value.replace(/_/g, " "),
      })),
    ];
  }, [articles, t]);

  const filtered = topic === "all" ? articles : articles.filter((a) => a.topics.includes(topic));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("news.title")}</Text>
      {!newsQuery.isLoading && topicOptions.length > 1 && (
        <View style={styles.chipsWrap}>
          <CategoryChips value={topic} onChange={setTopic} options={topicOptions} />
        </View>
      )}
      {newsQuery.isLoading ? (
        <ActivityIndicator color={colors.bullish} style={styles.loader} />
      ) : (
        <FlatList
          data={filtered}
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
  chipsWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  list: { padding: spacing.lg },
  loader: { marginTop: spacing.xl },
  empty: { color: colors.textMuted, textAlign: "center", marginTop: spacing.xl },
});
