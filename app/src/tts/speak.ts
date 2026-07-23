import * as Speech from "expo-speech";
import { Platform } from "react-native";

export interface VoiceAvailability {
  checked: boolean;
  available: boolean;
}

const LANGUAGE_CODES: Record<"th" | "en", string> = {
  th: "th-TH",
  en: "en-US",
};

let cachedVoices: Speech.Voice[] | null = null;

async function getVoices(): Promise<Speech.Voice[]> {
  if (cachedVoices) return cachedVoices;
  try {
    cachedVoices = await Speech.getAvailableVoicesAsync();
  } catch {
    cachedVoices = [];
  }
  return cachedVoices;
}

export async function checkVoiceAvailability(lang: "th" | "en"): Promise<VoiceAvailability> {
  if (Platform.OS === "web") {
    return { checked: true, available: false };
  }
  const voices = await getVoices();
  const prefix = lang === "th" ? "th" : "en";
  const available = voices.some((v) => v.language?.toLowerCase().startsWith(prefix));
  return { checked: true, available: available || voices.length === 0 };
}

export function speakText(text: string, lang: "th" | "en"): Promise<void> {
  return new Promise((resolve, reject) => {
    if (Platform.OS === "web") {
      resolve();
      return;
    }
    Speech.speak(text, {
      language: LANGUAGE_CODES[lang],
      onDone: () => resolve(),
      onStopped: () => resolve(),
      onError: (err) => reject(err),
    });
  });
}

export function stopSpeaking() {
  Speech.stop();
}
