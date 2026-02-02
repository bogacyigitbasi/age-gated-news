"use client";

import { NEWS_CATEGORIES, type NewsCategory } from "@/types/news";

const CATEGORY_LABELS: Record<NewsCategory, string> = {
  general: "General",
  world: "World",
  business: "Business",
  technology: "Technology",
  science: "Science",
  sports: "Sports",
  entertainment: "Entertainment",
  health: "Health",
};

interface CategoriesBarProps {
  selected: NewsCategory;
  onSelect: (category: NewsCategory) => void;
}

export function CategoriesBar({ selected, onSelect }: CategoriesBarProps) {
  return (
    <nav className="border-b border-gray-200 bg-white" aria-label="News categories">
      <div className="mx-auto max-w-7xl px-4">
        <div className="-mb-px flex gap-1 overflow-x-auto py-2 scrollbar-hide">
          {NEWS_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelect(cat)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                selected === cat
                  ? "bg-[#00D4AA] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              aria-current={selected === cat ? "page" : undefined}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
