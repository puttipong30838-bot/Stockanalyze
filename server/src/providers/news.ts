import Parser from "rss-parser";
import type { NewsArticle, NewsLang } from "../types/index.js";
import { extractTopics, scoreSentiment } from "../analysis/sentiment.js";

const parser = new Parser();

function googleNewsUrl(query: string, lang: NewsLang): string {
  const params =
    lang === "th"
      ? "hl=th&gl=TH&ceid=TH:th"
      : "hl=en&gl=US&ceid=US:en";
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&${params}`;
}

function hashId(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export async function fetchNews(
  query: string,
  lang: NewsLang,
  limit = 20
): Promise<NewsArticle[]> {
  const feed = await parser.parseURL(googleNewsUrl(query, lang));
  const items = (feed.items ?? []).slice(0, limit);

  return items.map((item) => {
    const title = item.title ?? "";
    const sentiment = scoreSentiment(title, lang);
    const topics = extractTopics(title);
    return {
      id: hashId((item.link ?? title) + lang),
      title,
      source: item.creator ?? feed.title ?? "Google News",
      url: item.link ?? "",
      publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
      sentiment,
      topics,
      lang,
    };
  });
}
