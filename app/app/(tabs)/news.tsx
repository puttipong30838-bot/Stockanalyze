import { useMemo, useState } from "react";
import { ActivityIndicator, SectionList, StyleSheet, View } from "react-native";
import { Text } from "@/components/common/AppText";
import { useTranslation } from "react-i18next";
import { colors, spacing } from "@/theme/colors";
import { NewsListItem } from "@/components/news/NewsListItem";
import { CategoryChips } from "@/components/common/CategoryChips";
import { useNews } from "@/api/hooks";
import { useSettingsStore } from "@/store/settingsStore";
import type { NewsArticle } from "@/types/api";

const CATEGORY_ORDER = [
  "earnings",
  "mergers_acquisitions",
  "dividend",
  "interest_rates",
  "regulation",
  "oil_energy",
  "leadership",
  "legal",
];

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
        label: t(`news.category.${value}`, value.replace(/_/g, " ")),
      })),
    ];
  }, [articles, t]);

  const sections = useMemo(() => {
    const map = new Map<string, NewsArticle[]>();
    for (const article of articles) {
      const key = CATEGORY_ORDER.find((c) => article.topics.includes(c)) ?? "general";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(article);
    }
    const orderedKeys = [...CATEGORY_ORDER.filter((c) => map.has(c)), ...(map.has("general") ? ["general"] : [])];
    return orderedKeys.map((key) => ({
      title: t(`news.category.${key}`, key.replace(/_/g, " ")),
      data: map.get(key)!,
    }));
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
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : topic === "all" ? (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <NewsListItem article={item} />}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          ListEmptyComponent={<Text style={styles.empty}>{t("common.noData")}</Text>}
          stickySectionHeadersEnabled={false}
        />
      ) : (
        <SectionList
          sections={[{ title: "", data: filtered }]}
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
  sectionHeader: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  loader: { marginTop: spacing.xl },
  empty: { color: colors.textMuted, textAlign: "center", marginTop: spacing.xl },
});
