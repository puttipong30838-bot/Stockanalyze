import { ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/components/common/AppText";
import { useTranslation } from "react-i18next";
import { colors, spacing } from "@/theme/colors";
import { SegmentedToggle } from "@/components/common/SegmentedToggle";
import { useSettingsStore } from "@/store/settingsStore";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const newsLanguage = useSettingsStore((s) => s.newsLanguage);
  const setNewsLanguage = useSettingsStore((s) => s.setNewsLanguage);
  const mode = useSettingsStore((s) => s.mode);
  const setMode = useSettingsStore((s) => s.setMode);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t("settings.title")}</Text>

      <View style={styles.section}>
        <Text style={styles.label}>{t("settings.tradingMode")}</Text>
        <SegmentedToggle
          value={mode}
          onChange={setMode}
          options={[
            { value: "investor", label: t("mode.investor") },
            { value: "trader", label: t("mode.trader") },
          ]}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{t("settings.language")}</Text>
        <SegmentedToggle
          value={language}
          onChange={setLanguage}
          options={[
            { value: "th", label: t("settings.thai") },
            { value: "en", label: t("settings.english") },
          ]}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{t("settings.newsLanguage")}</Text>
        <SegmentedToggle
          value={newsLanguage}
          onChange={setNewsLanguage}
          options={[
            { value: "th", label: t("settings.thai") },
            { value: "en", label: t("settings.english") },
          ]}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.xl },
  title: { color: colors.textPrimary, fontSize: 24, fontWeight: "800" },
  section: { gap: spacing.sm },
  label: { color: colors.textSecondary, fontSize: 14, fontWeight: "600" },
});
