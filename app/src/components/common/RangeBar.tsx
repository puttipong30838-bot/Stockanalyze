import { StyleSheet, View } from "react-native";
import { Text } from "@/components/common/AppText";
import { colors, spacing } from "@/theme/colors";

export function RangeBar({
  label,
  low,
  high,
  value,
  formatValue,
}: {
  label: string;
  low: number | null;
  high: number | null;
  value: number | null;
  formatValue: (n: number) => string;
}) {
  if (low == null || high == null || value == null || high <= low) {
    return null;
  }

  const pct = Math.min(1, Math.max(0, (value - low) / (high - low)));

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%` }]} />
        <View style={[styles.marker, { left: `${pct * 100}%` }]} />
      </View>
      <View style={styles.endpoints}>
        <Text style={styles.endpointText}>{formatValue(low)}</Text>
        <Text style={styles.endpointText}>{formatValue(high)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceAlt,
    position: "relative",
    overflow: "visible",
  },
  fill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
    opacity: 0.35,
  },
  marker: {
    position: "absolute",
    top: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: -5,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.background,
  },
  endpoints: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  endpointText: {
    color: colors.textSecondary,
    fontSize: 11,
  },
});
