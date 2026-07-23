import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { colors, flagColor, radius, spacing } from "@/theme/colors";
import type { NewsArticle } from "@/types/api";
import { checkVoiceAvailability, speakText, stopSpeaking } from "@/tts/speak";

export function NewsListItem({ article }: { article: NewsArticle }) {
  const { t } = useTranslation();
  const [speaking, setSpeaking] = useState(false);

  async function handleToggleAudio() {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    const availability = await checkVoiceAvailability(article.lang);
    if (!availability.available) {
      return;
    }
    setSpeaking(true);
    try {
      await speakText(article.title, article.lang);
    } finally {
      setSpeaking(false);
    }
  }

  const sentimentColor = flagColor(
    article.sentiment.label === "positive"
      ? "bullish"
      : article.sentiment.label === "negative"
        ? "bearish"
        : "neutral"
  );

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{article.title}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.source}>{article.source}</Text>
        <View style={[styles.sentimentDot, { backgroundColor: sentimentColor }]} />
        <Text style={[styles.sentimentText, { color: sentimentColor }]}>
          {t(`sentimentLabel.${article.sentiment.label}`)}
        </Text>
      </View>
      {article.topics.length > 0 && (
        <View style={styles.topicRow}>
          {article.topics.map((topic) => (
            <View key={topic} style={styles.topicChip}>
              <Text style={styles.topicText}>{topic.replace(/_/g, " ")}</Text>
            </View>
          ))}
        </View>
      )}
      <Pressable onPress={handleToggleAudio} style={styles.playButton}>
        <Text style={styles.playText}>
          {speaking ? t("news.stopAudio") : t("news.playAudio")}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  source: {
    color: colors.textMuted,
    fontSize: 12,
  },
  sentimentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sentimentText: {
    fontSize: 12,
    fontWeight: "600",
  },
  topicRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  topicChip: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  topicText: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  playButton: {
    alignSelf: "flex-start",
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.bullishMuted,
  },
  playText: {
    color: colors.bullish,
    fontSize: 12,
    fontWeight: "700",
  },
});
