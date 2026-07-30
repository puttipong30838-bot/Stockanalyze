import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { Text } from "@/components/common/AppText";
import { Stack, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { colors, spacing } from "@/theme/colors";
import { SegmentedToggle } from "@/components/common/SegmentedToggle";
import { useAuthStore } from "@/store/authStore";

type AuthTab = "login" | "register";

export default function AuthScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);

  const [tab, setTab] = useState<AuthTab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      if (tab === "login") {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, displayName.trim() || undefined);
      }
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.genericError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: t("auth.title") }} />
      <Text style={styles.subtitle}>{t("auth.freeAccountNote")}</Text>

      <SegmentedToggle
        value={tab}
        onChange={setTab}
        options={[
          { value: "login", label: t("auth.login") },
          { value: "register", label: t("auth.register") },
        ]}
      />

      <View style={styles.field}>
        <Text style={styles.label}>{t("auth.email")}</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
      </View>

      {tab === "register" && (
        <View style={styles.field}>
          <Text style={styles.label}>{t("auth.displayName")}</Text>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder={t("auth.displayNamePlaceholder")}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
        </View>
      )}

      <View style={styles.field}>
        <Text style={styles.label}>{t("auth.password")}</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder={tab === "register" ? t("auth.passwordHint") : ""}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        onPress={handleSubmit}
        disabled={submitting || !email || !password}
        style={[styles.submitButton, (submitting || !email || !password) && styles.submitButtonDisabled]}
      >
        <Text style={styles.submitButtonText}>
          {submitting ? t("common.loading") : tab === "login" ? t("auth.login") : t("auth.register")}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  subtitle: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  field: { gap: spacing.xs },
  label: { color: colors.textSecondary, fontSize: 13, fontWeight: "600" },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
  },
  error: { color: colors.bearish, fontSize: 12 },
  submitButton: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: colors.black, fontSize: 14, fontWeight: "800" },
});
