import * as Speech from "expo-speech";
import { Platform } from "react-native";

export interface VoiceAvailability {
  checked: boolean;
  available: boolean;
}

export interface VoiceOption {
  identifier: string;
  name: string;
  quality: string;
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

function voicesForLanguage(voices: Speech.Voice[], lang: "th" | "en"): Speech.Voice[] {
  const prefix = lang === "th" ? "th" : "en";
  return voices.filter((v) => v.language?.toLowerCase().startsWith(prefix));
}

function isEnhanced(voice: Speech.Voice): boolean {
  return String(voice.quality ?? "").toLowerCase().includes("enhanced");
}

/** Prefers an on-device "Enhanced" quality voice over the OS default. */
function pickBestVoice(voices: Speech.Voice[], lang: "th" | "en"): Speech.Voice | undefined {
  const candidates = voicesForLanguage(voices, lang);
  return candidates.find(isEnhanced) ?? candidates[0];
}

export async function checkVoiceAvailability(lang: "th" | "en"): Promise<VoiceAvailability> {
  if (Platform.OS === "web") {
    return { checked: true, available: false };
  }
  const voices = await getVoices();
  const available = voicesForLanguage(voices, lang).length > 0;
  return { checked: true, available: available || voices.length === 0 };
}

export async function listVoicesForLanguage(lang: "th" | "en"): Promise<VoiceOption[]> {
  if (Platform.OS === "web") return [];
  const voices = await getVoices();
  return voicesForLanguage(voices, lang).map((v) => ({
    identifier: v.identifier,
    name: v.name,
    quality: isEnhanced(v) ? "Enhanced" : "Default",
  }));
}

export function speakText(text: string, lang: "th" | "en", voiceId?: string | null): Promise<void> {
  return new Promise((resolve, reject) => {
    if (Platform.OS === "web") {
      resolve();
      return;
    }
    void (async () => {
      const voice = voiceId ?? pickBestVoice(await getVoices(), lang)?.identifier;
      Speech.speak(text, {
        language: LANGUAGE_CODES[lang],
        voice,
        onDone: () => resolve(),
        onStopped: () => resolve(),
        onError: (err) => reject(err),
      });
    })();
  });
}

export function stopSpeaking() {
  Speech.stop();
}
