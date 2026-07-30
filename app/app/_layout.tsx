import { useEffect } from "react";
import { View } from "react-native";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider, useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { colors } from "@/theme/colors";
import { fontsToLoad } from "@/theme/fonts";
import { useSettingsStore } from "@/store/settingsStore";
import { useAuthStore } from "@/store/authStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1 },
  },
});

function LanguageSync() {
  const language = useSettingsStore((s) => s.language);
  const { i18n: i18nInstance } = useTranslation();

  useEffect(() => {
    void i18nInstance.changeLanguage(language);
  }, [language, i18nInstance]);

  return null;
}

export default function RootLayout() {
  const hydrate = useSettingsStore((s) => s.hydrate);
  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const [fontsLoaded] = useFonts(fontsToLoad);

  useEffect(() => {
    void hydrate();
    void hydrateAuth();
  }, [hydrate, hydrateAuth]);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <SafeAreaProvider>
          <StatusBar style="light" />
          <LanguageSync />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.textPrimary,
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="stock/[symbol]" options={{ title: "" }} />
            <Stack.Screen name="auth" options={{ presentation: "modal" }} />
          </Stack>
        </SafeAreaProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}
