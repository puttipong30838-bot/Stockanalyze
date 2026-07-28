import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/common/AppText";
import { colors, radius, spacing } from "@/theme/colors";

export type RangeKey = "1D" | "5D" | "1M" | "6M" | "YTD" | "1Y" | "5Y";

export const RANGE_CONFIG: Record<RangeKey, { interval: string; range: string }> = {
  "1D": { interval: "5m", range: "1d" },
  "5D": { interval: "15m", range: "5d" },
  "1M": { interval: "1d", range: "1mo" },
  "6M": { interval: "1d", range: "6mo" },
  YTD: { interval: "1d", range: "ytd" },
  "1Y": { interval: "1d", range: "1y" },
  "5Y": { interval: "1wk", range: "5y" },
};

const ORDER: RangeKey[] = ["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y"];

export function RangeSelector({
  value,
  onChange,
}: {
  value: RangeKey;
  onChange: (value: RangeKey) => void;
}) {
  return (
    <View style={styles.row}>
      {ORDER.map((key) => {
        const active = key === value;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            style={[styles.pill, active && styles.pillActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{key}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  pill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  pillActive: {
    backgroundColor: colors.bullishMuted,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  labelActive: {
    color: colors.bullish,
  },
});
