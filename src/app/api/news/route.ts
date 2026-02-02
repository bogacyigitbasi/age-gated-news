import { NextRequest, NextResponse } from "next/server";
import { fetchNews } from "@/lib/news-service";
import { getSession } from "@/lib/session";
import { NEWS_CATEGORIES, type NewsCategory } from "@/types/news";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = (searchParams.get("category") || "general") as NewsCategory;

  if (!NEWS_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const session = await getSession();
  const isVerified = session.isVerified === true;

  const articles = await fetchNews(category);

  // If not verified, strip full content from articles
  const responseArticles = articles.map((article) => ({
    ...article,
    content: isVerified ? article.content : "",
  }));

  return NextResponse.json({
    articles: responseArticles,
    category,
    isVerified,
    cachedAt: new Date().toISOString(),
  });
}
