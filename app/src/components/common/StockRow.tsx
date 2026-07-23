import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "@/theme/colors";
import type { Quote } from "@/types/api";

export function StockRow({
  quote,
  name,
  onPress,
}: {
  quote: Quote;
  name?: string;
  onPress: () => void;
}) {
  const isUp = (quote.changePercent ?? 0) >= 0;
  const changeColor = isUp ? colors.bullish : colors.bearish;

  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.symbol}>{quote.symbol}</Text>
        {name && (
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
        )}
      </View>
      <View style={styles.right}>
        <Text style={styles.price}>
          {quote.price != null ? quote.price.toFixed(2) : "-"}
        </Text>
        <Text style={[styles.change, { color: changeColor }]}>
          {isUp ? "+" : ""}
          {quote.changePercent != null ? quote.changePercent.toFixed(2) : "0.00"}%
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  left: {
    flex: 1,
    marginRight: spacing.sm,
  },
  symbol: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
  name: {
    color: colors.textMuted,
    fontSize: 12,
  },
  right: {
    alignItems: "flex-end",
  },
  price: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  change: {
    fontSize: 12,
    fontWeight: "600",
  },
});
