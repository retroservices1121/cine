"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { relativeTime } from "@/lib/utils";

interface NewsArticle {
  title: string;
  source: string;
  published_at: string;
  url: string;
  relevance_score: number;
  matched_markets?: { platform: string; market_id: string; title: string }[];
}

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [minRelevance, setMinRelevance] = useState(0);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch("/api/news?limit=30");
        const data = await res.json();
        setArticles(Array.isArray(data) ? data : []);
      } catch {
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
    const timer = setInterval(fetchNews, 300000); // 5 min
    return () => clearInterval(timer);
  }, []);

  const filtered = articles.filter((a) => a.relevance_score >= minRelevance);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">News</h1>
          <p className="text-text-muted text-sm mt-1">
            Market-relevant headlines
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-text-muted">Min relevance:</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={minRelevance}
            onChange={(e) => setMinRelevance(Number(e.target.value))}
            className="w-24 accent-accent"
          />
          <span className="text-xs font-mono w-8">{minRelevance.toFixed(1)}</span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 skeleton rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <p className="text-text-muted">No articles match the filter</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((article, i) => (
            <article
              key={i}
              className="bg-card border border-border rounded-xl p-5 hover:bg-card-hover transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold hover:text-accent transition-colors line-clamp-2"
                  >
                    {article.title}
                  </a>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-text-muted">
                    <span className="font-medium">{article.source}</span>
                    <span>{relativeTime(article.published_at)}</span>
                    <span className="px-1.5 py-0.5 bg-accent/10 text-accent rounded text-[10px]">
                      {(article.relevance_score * 100).toFixed(0)}% relevant
                    </span>
                  </div>
                </div>
              </div>
              {/* Matched markets */}
              {article.matched_markets && article.matched_markets.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {article.matched_markets.map((m, j) => (
                    <Link
                      key={j}
                      href={`/market/${m.platform}/${encodeURIComponent(m.market_id)}`}
                      className="px-2 py-1 bg-bg rounded-md border border-border text-[10px] text-text-secondary hover:border-accent/40 hover:text-accent transition-colors truncate max-w-[200px]"
                    >
                      {m.title}
                    </Link>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
