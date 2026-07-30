import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "@/api/client";
import { useSettingsStore } from "@/store/settingsStore";
import type { AuthUser } from "@/types/api";

const STORAGE_KEY = "stockpulse:auth:v1";

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  hydrated: boolean;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hydrate: () => Promise<void>;
}

async function persist(token: string | null, user: AuthUser | null) {
  try {
    if (token && user) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // best-effort persistence; ignore storage failures
  }
}

/** Pulls the server's copy of watchlist/settings down after login so a
 * returning user's other devices' state wins over whatever was local. */
async function pullServerStateIntoSettings(token: string) {
  try {
    const [watchlist, settings] = await Promise.all([
      api.userWatchlist.get(token),
      api.userSettings.get(token),
    ]);
    useSettingsStore.getState().hydrateFromServer({
      watchlist,
      language: settings.language as "th" | "en",
      newsLanguage: settings.newsLanguage as "th" | "en",
      mode: settings.mode as "investor" | "trader",
    });
  } catch {
    // best-effort; keep local settings if the server is unreachable
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  hydrated: false,

  register: async (email, password, displayName) => {
    const data = await api.auth.register(email, password, displayName);
    set({ token: data.token, user: data.user });
    void persist(data.token, data.user);
    void pullServerStateIntoSettings(data.token);
  },

  login: async (email, password) => {
    const data = await api.auth.login(email, password);
    set({ token: data.token, user: data.user });
    void persist(data.token, data.user);
    void pullServerStateIntoSettings(data.token);
  },

  logout: () => {
    set({ token: null, user: null });
    void persist(null, null);
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({ token: parsed.token ?? null, user: parsed.user ?? null });
      }
    } finally {
      set({ hydrated: true });
    }
  },
}));
