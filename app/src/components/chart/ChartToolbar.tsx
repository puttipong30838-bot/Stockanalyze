import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/common/AppText";
import { useTranslation } from "react-i18next";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, radius, spacing } from "@/theme/colors";

export type DrawMode = "none" | "trendline" | "hline";

export function ChartToolbar({
  drawMode,
  onSetDrawMode,
  onClear,
  onShare,
}: {
  drawMode: DrawMode;
  onSetDrawMode: (mode: DrawMode) => void;
  onClear: () => void;
  onShare: () => void;
}) {
  const { t } = useTranslation();

  function toggle(mode: DrawMode) {
    onSetDrawMode(drawMode === mode ? "none" : mode);
  }

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => toggle("trendline")}
        style={[styles.button, drawMode === "trendline" && styles.buttonActive]}
      >
        <Ionicons
          name="trending-up-outline"
          size={14}
          color={drawMode === "trendline" ? colors.black : colors.textSecondary}
        />
        <Text style={[styles.buttonText, drawMode === "trendline" && styles.buttonTextActive]}>
          {t("stock.drawTrendline")}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => toggle("hline")}
        style={[styles.button, drawMode === "hline" && styles.buttonActive]}
      >
        <Ionicons
          name="remove-outline"
          size={14}
          color={drawMode === "hline" ? colors.black : colors.textSecondary}
        />
        <Text style={[styles.buttonText, drawMode === "hline" && styles.buttonTextActive]}>
          {t("stock.drawHLine")}
        </Text>
      </Pressable>
      <Pressable onPress={onClear} style={styles.button}>
        <Ionicons name="trash-outline" size={14} color={colors.textSecondary} />
        <Text style={styles.buttonText}>{t("stock.clearDrawings")}</Text>
      </Pressable>
      <View style={styles.spacer} />
      <Pressable onPress={onShare} style={styles.button}>
        <Ionicons name="share-outline" size={14} color={colors.textSecondary} />
        <Text style={styles.buttonText}>{t("stock.share")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  spacer: { flex: 1 },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  buttonText: { color: colors.textSecondary, fontSize: 11, fontWeight: "700" },
  buttonTextActive: { color: colors.black },
});
