import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type UiLanguage = "th" | "en";
export type TradingMode = "investor" | "trader";
export type DisplayCurrency = "USD" | "THB";
export type TtsVoiceMap = { th: string | null; en: string | null };

interface SettingsState {
  language: UiLanguage;
  newsLanguage: UiLanguage;
  mode: TradingMode;
  watchlist: string[];
  displayCurrency: DisplayCurrency;
  ttsVoice: TtsVoiceMap;
  hydrated: boolean;
  setLanguage: (lang: UiLanguage) => void;
  setNewsLanguage: (lang: UiLanguage) => void;
  setMode: (mode: TradingMode) => void;
  toggleWatchlist: (symbol: string) => void;
  setDisplayCurrency: (currency: DisplayCurrency) => void;
  setTtsVoice: (lang: UiLanguage, voiceId: string | null) => void;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = "stockpulse:settings:v1";

async function persist(partial: {
  language: UiLanguage;
  newsLanguage: UiLanguage;
  mode: TradingMode;
  watchlist: string[];
  displayCurrency: DisplayCurrency;
  ttsVoice: TtsVoiceMap;
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
  displayCurrency: "USD",
  ttsVoice: { th: null, en: null },
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
  setDisplayCurrency: (displayCurrency) => {
    set({ displayCurrency });
    void persist({ ...get(), displayCurrency });
  },
  setTtsVoice: (lang, voiceId) => {
    const ttsVoice = { ...get().ttsVoice, [lang]: voiceId };
    set({ ttsVoice });
    void persist({ ...get(), ttsVoice });
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
          displayCurrency: parsed.displayCurrency ?? "USD",
          ttsVoice: parsed.ttsVoice ?? { th: null, en: null },
        });
      }
    } finally {
      set({ hydrated: true });
    }
  },
}));
