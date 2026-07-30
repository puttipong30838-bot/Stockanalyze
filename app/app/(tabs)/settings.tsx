import { useEffect, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/components/common/AppText";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Constants from "expo-constants";
import { useQueryClient } from "@tanstack/react-query";
import { colors, spacing } from "@/theme/colors";
import { SegmentedToggle } from "@/components/common/SegmentedToggle";
import { useSettingsStore } from "@/store/settingsStore";
import { useAuthStore } from "@/store/authStore";
import { listVoicesForLanguage, type VoiceOption } from "@/tts/speak";

function VoicePicker({ lang }: { lang: "th" | "en" }) {
  const { t } = useTranslation();
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const selected = useSettingsStore((s) => s.ttsVoice[lang]);
  const setTtsVoice = useSettingsStore((s) => s.setTtsVoice);

  useEffect(() => {
    if (Platform.OS === "web") return;
    let cancelled = false;
    listVoicesForLanguage(lang).then((list) => {
      if (!cancelled) setVoices(list);
    });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  if (Platform.OS === "web") {
    return <Text style={styles.hint}>{t("settings.voiceUnavailableWeb")}</Text>;
  }
  if (voices.length === 0) {
    return <Text style={styles.hint}>{t("settings.voiceAuto")}</Text>;
  }

  return (
    <View style={styles.voiceList}>
      <Pressable
        onPress={() => setTtsVoice(lang, null)}
        style={[styles.voiceRow, selected === null && styles.voiceRowActive]}
      >
        <Text style={selected === null ? styles.voiceRowTextActive : styles.voiceRowText}>
          {t("settings.voiceAuto")}
        </Text>
      </Pressable>
      {voices.map((v) => (
        <Pressable
          key={v.identifier}
          onPress={() => setTtsVoice(lang, v.identifier)}
          style={[styles.voiceRow, selected === v.identifier && styles.voiceRowActive]}
        >
          <Text style={selected === v.identifier ? styles.voiceRowTextActive : styles.voiceRowText}>
            {v.name} {v.quality === "Enhanced" ? "★" : ""}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const newsLanguage = useSettingsStore((s) => s.newsLanguage);
  const setNewsLanguage = useSettingsStore((s) => s.setNewsLanguage);
  const mode = useSettingsStore((s) => s.mode);
  const setMode = useSettingsStore((s) => s.setMode);
  const displayCurrency = useSettingsStore((s) => s.displayCurrency);
  const setDisplayCurrency = useSettingsStore((s) => s.setDisplayCurrency);

  function handleClearCache() {
    queryClient.clear();
    Alert.alert(t("settings.cacheCleared"));
  }

  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t("settings.title")}</Text>

      <View style={styles.section}>
        <Text style={styles.label}>{t("settings.account")}</Text>
        {user ? (
          <View style={styles.accountRow}>
            <Text style={styles.aboutText}>{user.displayName || user.email}</Text>
            <Pressable onPress={logout} style={styles.actionButton}>
              <Text style={styles.actionButtonText}>{t("settings.logOut")}</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => router.push("/auth")} style={styles.loginButton}>
            <Text style={styles.loginButtonText}>{t("settings.logInOrSignUp")}</Text>
          </Pressable>
        )}
        <Text style={styles.footnote}>{t("settings.accountNote")}</Text>
      </View>

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

      <View style={styles.section}>
        <Text style={styles.label}>{t("settings.displayCurrency")}</Text>
        <SegmentedToggle
          value={displayCurrency}
          onChange={setDisplayCurrency}
          options={[
            { value: "USD", label: "USD" },
            { value: "THB", label: "THB" },
          ]}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{t("settings.ttsVoiceThai")}</Text>
        <VoicePicker lang="th" />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{t("settings.ttsVoiceEnglish")}</Text>
        <VoicePicker lang="en" />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{t("settings.dataAndStorage")}</Text>
        <Pressable onPress={handleClearCache} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>{t("settings.clearCache")}</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{t("settings.about")}</Text>
        <Text style={styles.aboutText}>StockPulse v{appVersion}</Text>
        <Text style={styles.footnote}>{t("settings.aboutNote")}</Text>
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
  hint: { color: colors.textMuted, fontSize: 12 },
  voiceList: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  voiceRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  voiceRowActive: {
    backgroundColor: colors.accentMuted,
  },
  voiceRowText: { color: colors.textSecondary, fontSize: 13 },
  voiceRowTextActive: { color: colors.accent, fontSize: 13, fontWeight: "700" },
  actionButton: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonText: { color: colors.bearish, fontSize: 13, fontWeight: "700" },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  loginButton: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  loginButtonText: { color: colors.black, fontSize: 13, fontWeight: "800" },
  aboutText: { color: colors.textPrimary, fontSize: 13, fontWeight: "600" },
  footnote: { color: colors.textMuted, fontSize: 11, fontStyle: "italic" },
});
