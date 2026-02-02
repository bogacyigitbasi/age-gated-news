export type NewsCategory =
  | "general"
  | "world"
  | "business"
  | "technology"
  | "science"
  | "sports"
  | "entertainment"
  | "health";

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  url: string;
  imageUrl: string | null;
  publishedAt: string;
  source: {
    name: string;
    url: string;
  };
  category: NewsCategory;
  provider: "gnews" | "guardian";
}

export interface NewsResponse {
  articles: NewsArticle[];
  category: NewsCategory;
  isVerified: boolean;
  cachedAt: string;
}

export const NEWS_CATEGORIES: NewsCategory[] = [
  "general",
  "world",
  "business",
  "technology",
  "science",
  "sports",
  "entertainment",
  "health",
];

/** Maps our unified categories to each API's category/section names */
export const CATEGORY_MAP: Record<
  NewsCategory,
  { gnews: string; guardian: string }
> = {
  general: { gnews: "general", guardian: "news" },
  world: { gnews: "world", guardian: "world" },
  business: { gnews: "business", guardian: "business" },
  technology: { gnews: "technology", guardian: "technology" },
  science: { gnews: "science", guardian: "science" },
  sports: { gnews: "sports", guardian: "sport" },
  entertainment: { gnews: "entertainment", guardian: "culture" },
  health: { gnews: "health", guardian: "lifeandstyle" },
};
