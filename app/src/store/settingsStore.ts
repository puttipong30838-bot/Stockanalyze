import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type UiLanguage = "th" | "en";
export type TradingMode = "investor" | "trader";

interface SettingsState {
  language: UiLanguage;
  newsLanguage: UiLanguage;
  mode: TradingMode;
  watchlist: string[];
  hydrated: boolean;
  setLanguage: (lang: UiLanguage) => void;
  setNewsLanguage: (lang: UiLanguage) => void;
  setMode: (mode: TradingMode) => void;
  toggleWatchlist: (symbol: string) => void;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = "stockpulse:settings:v1";

async function persist(partial: {
  language: UiLanguage;
  newsLanguage: UiLanguage;
  mode: TradingMode;
  watchlist: string[];
}) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(partial));
  } catch {
    // best-effort persistence; ignore storage failures
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  language: "th",
  newsLanguage: "th",
  mode: "investor",
  watchlist: [],
  hydrated: false,

  setLanguage: (language) => {
    set({ language });
    void persist({ ...get(), language });
  },
  setNewsLanguage: (newsLanguage) => {
    set({ newsLanguage });
    void persist({ ...get(), newsLanguage });
  },
  setMode: (mode) => {
    set({ mode });
    void persist({ ...get(), mode });
  },
  toggleWatchlist: (symbol) => {
    const current = get().watchlist;
    const watchlist = current.includes(symbol)
      ? current.filter((s) => s !== symbol)
      : [...current, symbol];
    set({ watchlist });
    void persist({ ...get(), watchlist });
  },
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({
          language: parsed.language ?? "th",
          newsLanguage: parsed.newsLanguage ?? "th",
          mode: parsed.mode ?? "investor",
          watchlist: parsed.watchlist ?? [],
        });
      }
    } finally {
      set({ hydrated: true });
    }
  },
}));
