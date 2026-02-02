"use client";

import Image from "next/image";
import type { NewsArticle } from "@/types/news";
import { useVerificationContext } from "@/components/verification/VerificationProvider";

export function NewsCard({ article }: { article: NewsArticle }) {
  const { isVerified } = useVerificationContext();

  return (
    <article className="group relative overflow-hidden rounded-xl bg-white shadow-md transition-shadow hover:shadow-lg">
      {/* Image */}
      <div className="relative h-48 bg-gray-200">
        {article.imageUrl ? (
          <Image
            src={article.imageUrl}
            alt=""
            fill
            className={`object-cover transition-all duration-300 ${
              !isVerified ? "scale-105 blur-sm" : ""
            }`}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
            <span className="text-4xl text-gray-400">N</span>
          </div>
        )}
        {!isVerified && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <span className="rounded-full bg-white/90 px-3 py-1 text-sm font-medium text-gray-800">
              18+ Verification Required
            </span>
          </div>
        )}
        <div className="absolute bottom-2 left-2">
          <span className="rounded bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
            {article.source.name}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="mb-1 text-xs text-gray-500">
          {new Date(article.publishedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
        <h3
          className={`mb-2 line-clamp-2 font-semibold leading-snug text-gray-900 ${
            !isVerified ? "blur-[2px]" : ""
          }`}
        >
          {article.title}
        </h3>
        <p
          className={`line-clamp-3 text-sm text-gray-600 ${
            !isVerified ? "blur-[3px]" : ""
          }`}
        >
          {article.description}
        </p>
        {isVerified && (
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-medium text-[#00D4AA] hover:underline"
          >
            Read full article &rarr;
          </a>
        )}
      </div>
    </article>
  );
}
