import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors } from "@/theme/colors";

function tabIcon(focusedName: keyof typeof Ionicons.glyphMap, outlineName: keyof typeof Ionicons.glyphMap) {
  return ({ color, focused, size }: { color: string; focused: boolean; size: number }) => (
    <Ionicons name={focused ? focusedName : outlineName} size={size} color={color} />
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t("tabs.home"), tabBarIcon: tabIcon("home", "home-outline") }}
      />
      <Tabs.Screen
        name="watchlist"
        options={{ title: t("tabs.watchlist"), tabBarIcon: tabIcon("bookmark", "bookmark-outline") }}
      />
      <Tabs.Screen
        name="community"
        options={{ title: t("tabs.community"), tabBarIcon: tabIcon("people", "people-outline") }}
      />
      <Tabs.Screen
        name="news"
        options={{ title: t("tabs.news"), tabBarIcon: tabIcon("newspaper", "newspaper-outline") }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: t("tabs.settings"), tabBarIcon: tabIcon("settings", "settings-outline") }}
      />
    </Tabs>
  );
}
