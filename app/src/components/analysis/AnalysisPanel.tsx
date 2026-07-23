import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { colors, flagColor, spacing } from "@/theme/colors";
import type { AnalysisBundle } from "@/types/api";
import { InsightCard } from "./InsightCard";
import { Badge } from "./Badge";

function trendColor(direction: AnalysisBundle["trend"]["direction"]) {
  if (direction === "up") return colors.bullish;
  if (direction === "down") return colors.bearish;
  return colors.neutral;
}

function holdColor(label: AnalysisBundle["holdRecommendation"]["label"]) {
  if (label === "buy") return colors.bullish;
  if (label === "reduce") return colors.bearish;
  return colors.neutral;
}

export function AnalysisPanel({ analysis }: { analysis: AnalysisBundle }) {
  const { t } = useTranslation();

  return (
    <View>
      <InsightCard title={t("stock.holdRecommendation")}>
        <Badge
          label={t(`hold.${analysis.holdRecommendation.label}`)}
          color={holdColor(analysis.holdRecommendation.label)}
        />
        <Text style={styles.body}>{analysis.holdRecommendation.rationale}</Text>
      </InsightCard>

      <InsightCard title={t("stock.aiPlan")}>
        <Text style={styles.body}>{analysis.aiPlan.text}</Text>
      </InsightCard>

      <InsightCard title={t("stock.summary")}>
        <Text style={styles.body}>{analysis.summary}</Text>
      </InsightCard>

      <View style={styles.row}>
        <View style={styles.rowItem}>
          <InsightCard title={t("stock.trend")}>
            <Badge
              label={t(`trendLabel.${analysis.trend.direction}`)}
              color={trendColor(analysis.trend.direction)}
            />
            <Text style={styles.caption}>
              {Math.round(analysis.trend.confidence * 100)}% confidence
            </Text>
          </InsightCard>
        </View>
        <View style={styles.rowItem}>
          <InsightCard title={t("stock.volatility")}>
            <Badge
              label={t(`volatilityLabel.${analysis.volatility.level}`)}
              color={colors.neutral}
            />
            <Text style={styles.caption}>
              {analysis.volatility.realizedVolPct}% realized
            </Text>
          </InsightCard>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.rowItem}>
          <InsightCard title={t("stock.volume")}>
            <Badge
              label={t(`volumeLabel.${analysis.volume.callout}`)}
              color={colors.neutral}
            />
            <Text style={styles.caption}>{analysis.volume.relativeVolume}x avg</Text>
          </InsightCard>
        </View>
        <View style={styles.rowItem}>
          <InsightCard title={t("stock.sentiment")}>
            <Badge
              label={t(`sentimentLabel.${analysis.sentiment.label}`)}
              color={flagColor(
                analysis.sentiment.label === "positive"
                  ? "bullish"
                  : analysis.sentiment.label === "negative"
                    ? "bearish"
                    : "neutral"
              )}
            />
          </InsightCard>
        </View>
      </View>

      <InsightCard title={t("stock.institutionalDemand")}>
        <Badge
          label={t(`flagLabel.${analysis.institutionalDemand.flag}`)}
          color={flagColor(analysis.institutionalDemand.flag)}
        />
        <Text style={styles.caption}>score {analysis.institutionalDemand.score}</Text>
        <Text style={styles.footnote}>{t("stock.methodologyNote")}</Text>
      </InsightCard>

      {analysis.consolidation.flag === "neutral" && (
        <InsightCard title={t("stock.consolidation")}>
          <Badge label={t("flagLabel.neutral")} color={colors.neutral} />
          <Text style={styles.caption}>
            {analysis.consolidation.zones.length} zone(s) detected
          </Text>
        </InsightCard>
      )}

      {analysis.detectedPatterns.length > 0 && (
        <InsightCard title={t("stock.detectedPatterns")}>
          <View style={styles.chipRow}>
            {analysis.detectedPatterns.map((p, idx) => (
              <Badge
                key={`${p.name}-${idx}`}
                label={`${p.name.replace(/_/g, " ")} (${Math.round(p.confidence * 100)}%)`}
                color={colors.textSecondary}
              />
            ))}
          </View>
        </InsightCard>
      )}

      <InsightCard title={t("stock.detailedAnalysis")}>
        <Text style={styles.body}>{analysis.detailedAnalysis}</Text>
      </InsightCard>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 19,
  },
  caption: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  footnote: {
    color: colors.textMuted,
    fontSize: 11,
    fontStyle: "italic",
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  rowItem: {
    flex: 1,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
});
