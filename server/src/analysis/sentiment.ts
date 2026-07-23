import type { NewsLang, SentimentResult } from "../types/index.js";
import lexiconEn from "../data/sentimentLexicon.en.json" with { type: "json" };
import lexiconTh from "../data/sentimentLexicon.th.json" with { type: "json" };

const LEXICONS: Record<NewsLang, { positive: string[]; negative: string[] }> = {
  en: lexiconEn,
  th: lexiconTh,
};

export function scoreSentiment(text: string, lang: NewsLang): SentimentResult {
  const lexicon = LEXICONS[lang];
  const haystack = lang === "en" ? text.toLowerCase() : text;

  let positiveHits = 0;
  let negativeHits = 0;

  for (const word of lexicon.positive) {
    const needle = lang === "en" ? word.toLowerCase() : word;
    if (haystack.includes(needle)) positiveHits++;
  }
  for (const word of lexicon.negative) {
    const needle = lang === "en" ? word.toLowerCase() : word;
    if (haystack.includes(needle)) negativeHits++;
  }

  const total = positiveHits + negativeHits;
  const score = total === 0 ? 0 : (positiveHits - negativeHits) / total;

  let label: SentimentResult["label"] = "neutral";
  if (score > 0.15) label = "positive";
  else if (score < -0.15) label = "negative";

  return { score: Math.round(score * 100) / 100, label };
}

export function aggregateSentiment(results: SentimentResult[]): SentimentResult {
  if (results.length === 0) return { score: 0, label: "neutral" };
  const avg =
    results.reduce((acc, r) => acc + r.score, 0) / results.length;
  let label: SentimentResult["label"] = "neutral";
  if (avg > 0.15) label = "positive";
  else if (avg < -0.15) label = "negative";
  return { score: Math.round(avg * 100) / 100, label };
}

const TOPIC_KEYWORDS: Record<string, string[]> = {
  earnings: ["earnings", "quarterly results", "profit", "กำไร", "ผลประกอบการ"],
  dividend: ["dividend", "ปันผล"],
  mergers_acquisitions: ["merger", "acquisition", "acquire", "ควบรวม", "เข้าซื้อกิจการ"],
  regulation: ["regulation", "regulator", "sec ", "กลต", "กฎหมาย", "regulatory"],
  interest_rates: ["interest rate", "fed ", "federal reserve", "bot ", "ธปท", "ดอกเบี้ย"],
  oil_energy: ["oil price", "crude", "energy prices", "ราคาน้ำมัน"],
  leadership: ["ceo", "chairman", "resign", "appoint", "ผู้บริหาร"],
  legal: ["lawsuit", "investigation", "fraud", "ฟ้องร้อง", "สอบสวน"],
};

export function extractTopics(text: string): string[] {
  const lower = text.toLowerCase();
  const topics: string[] = [];
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k.toLowerCase()) || text.includes(k))) {
      topics.push(topic);
    }
  }
  return topics;
}
