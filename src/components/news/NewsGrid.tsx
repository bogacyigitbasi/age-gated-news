"use client";

import { useState, useEffect } from "react";
import type { NewsArticle, NewsCategory } from "@/types/news";
import { CategoriesBar } from "@/components/layout/CategoriesBar";
import { NewsCard } from "./NewsCard";
import { NewsCardSkeleton } from "./NewsCardSkeleton";

interface NewsGridProps {
  initialArticles: NewsArticle[];
  initialCategory?: NewsCategory;
}

export function NewsGrid({
  initialArticles,
  initialCategory = "general",
}: NewsGridProps) {
  const [articles, setArticles] = useState(initialArticles);
  const [category, setCategory] = useState<NewsCategory>(initialCategory);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category === initialCategory && articles === initialArticles) return;

    let cancelled = false;
    setLoading(true);

    fetch(`/api/news?category=${category}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setArticles(data.articles || []);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  return (
    <>
      <CategoriesBar selected={category} onSelect={setCategory} />
      <div className="mx-auto max-w-7xl px-4 py-8">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <NewsCardSkeleton key={i} />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg text-gray-500">
              No articles found for this category.
            </p>
            <p className="mt-1 text-sm text-gray-400">
              Try a different category or check back later.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
