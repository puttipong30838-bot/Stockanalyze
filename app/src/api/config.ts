import Constants from "expo-constants";

/**
 * The Fastify backend must be reachable from your phone, not just your computer.
 * "localhost" only works in web/simulator — on a real device via Expo Go, set this
 * to your computer's LAN IP (e.g. http://192.168.1.20:4000), or a deployed URL.
 * Override by setting `apiBaseUrl` under `expo.extra` in app.json, or the
 * EXPO_PUBLIC_API_BASE_URL env var.
 */
const fallback = "http://localhost:4000";

export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  fallback;
