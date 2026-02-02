import type { NewsArticle, NewsCategory } from "@/types/news";
import { CATEGORY_MAP } from "@/types/news";
import { NEWS_CACHE_TTL } from "./config";

/* eslint-disable @typescript-eslint/no-explicit-any */

async function fetchGNews(category: NewsCategory): Promise<NewsArticle[]> {
  const gnewsCat = CATEGORY_MAP[category].gnews;
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) return [];

  const url = `https://gnews.io/api/v4/top-headlines?category=${gnewsCat}&lang=en&max=10&apikey=${apiKey}`;

  try {
    const res = await fetch(url, { next: { revalidate: NEWS_CACHE_TTL } });
    if (!res.ok) return [];

    const data = await res.json();
    return (data.articles || []).map((a: any, i: number) => ({
      id: `gnews-${category}-${i}`,
      title: a.title ?? "",
      description: a.description ?? "",
      content: a.content ?? "",
      url: a.url,
      imageUrl: a.image || null,
      publishedAt: a.publishedAt,
      source: {
        name: a.source?.name || "Unknown",
        url: a.source?.url || "",
      },
      category,
      provider: "gnews" as const,
    }));
  } catch {
    return [];
  }
}

async function fetchGuardian(category: NewsCategory): Promise<NewsArticle[]> {
  const guardianSection = CATEGORY_MAP[category].guardian;
  const apiKey = process.env.GUARDIAN_API_KEY;
  if (!apiKey) return [];

  const fields = "headline,trailText,thumbnail,byline,bodyText";
  const url = `https://content.guardianapis.com/search?section=${guardianSection}&show-fields=${fields}&page-size=10&api-key=${apiKey}`;

  try {
    const res = await fetch(url, { next: { revalidate: NEWS_CACHE_TTL } });
    if (!res.ok) return [];

    const data = await res.json();
    return (data.response?.results || []).map((r: any) => ({
      id: `guardian-${r.id || ""}`,
      title: r.fields?.headline || r.webTitle || "",
      description: r.fields?.trailText || "",
      content: r.fields?.bodyText || "",
      url: r.webUrl,
      imageUrl: r.fields?.thumbnail || null,
      publishedAt: r.webPublicationDate,
      source: {
        name: "The Guardian",
        url: "https://www.theguardian.com",
      },
      category,
      provider: "guardian" as const,
    }));
  } catch {
    return [];
  }
}

function deduplicateByTitle(articles: NewsArticle[]): NewsArticle[] {
  const seen = new Set<string>();
  return articles.filter((a) => {
    const normalized = a.title.toLowerCase().trim().slice(0, 60);
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

export async function fetchNews(
  category: NewsCategory,
): Promise<NewsArticle[]> {
  const [gnewsResult, guardianResult] = await Promise.allSettled([
    fetchGNews(category),
    fetchGuardian(category),
  ]);

  const articles: NewsArticle[] = [
    ...(gnewsResult.status === "fulfilled" ? gnewsResult.value : []),
    ...(guardianResult.status === "fulfilled" ? guardianResult.value : []),
  ];

  // Sort by published date descending
  articles.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  return deduplicateByTitle(articles);
}
