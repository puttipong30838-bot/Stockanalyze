import { Linking, Pressable, StyleSheet } from "react-native";
import { Text } from "@/components/common/AppText";
import { useTranslation } from "react-i18next";
import { colors, radius, spacing } from "@/theme/colors";
import { AFFILIATE_BROKER, isAffiliateConfigured } from "@/config/monetization";

/** Renders nothing until AFFILIATE_BROKER.referralUrl is filled in -- safe
 * to mount anywhere without changing what users see today. */
export function SponsoredBrokerCard() {
  const { t } = useTranslation();
  if (!isAffiliateConfigured()) return null;

  return (
    <Pressable
      onPress={() => Linking.openURL(AFFILIATE_BROKER.referralUrl)}
      style={styles.card}
    >
      <Text style={styles.badge}>{t("monetization.sponsoredLabel")}</Text>
      <Text style={styles.title}>
        {t("monetization.openAccountTitle", { broker: AFFILIATE_BROKER.brokerName })}
      </Text>
      <Text style={styles.subtitle}>{t("monetization.openAccountSubtitle")}</Text>
      <Text style={styles.cta}>{t("monetization.openAccountCta")}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.accentMuted,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: 4,
  },
  badge: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: { color: colors.textPrimary, fontSize: 14, fontWeight: "700" },
  subtitle: { color: colors.textSecondary, fontSize: 12, lineHeight: 17 },
  cta: { color: colors.accent, fontSize: 12, fontWeight: "700", marginTop: 4 },
});
