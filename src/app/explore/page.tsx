"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import MarketCard from "@/components/MarketCard";
import { cn } from "@/lib/utils";

interface Market {
  market_id: string;
  platform: string;
  title?: string;
  question?: string;
  outcomes?: { yes: number; no: number };
  volume?: number;
  volume_24h?: number;
  liquidity?: number;
  category?: string;
  end_date?: string;
  image_url?: string;
}

const SORTS = [
  { value: "volume", label: "Volume" },
  { value: "newest", label: "Newest" },
  { value: "ending_soon", label: "Ending Soon" },
];

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8"><div className="h-8 skeleton rounded w-48 mb-6" /><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({length:6}).map((_,i)=><div key={i} className="h-[150px] skeleton rounded-xl"/>)}</div></div>}>
      <ExploreContent />
    </Suspense>
  );
}

function ExploreContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [search, setSearch] = useState(initialSearch);
  const [sort, setSort] = useState("volume");
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const limit = 24;

  const fetchMarkets = useCallback(async (reset = false) => {
    const newOffset = reset ? 0 : offset;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        platform: "spredd",
        sort_by: sort,
        limit: String(limit),
        offset: String(newOffset),
      });
      if (search) params.set("search", search);
      const res = await fetch(`/api/markets?${params}`);
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];
      if (reset) {
        setMarkets(arr);
        setOffset(limit);
      } else {
        setMarkets((prev) => [...prev, ...arr]);
        setOffset(newOffset + limit);
      }
      setHasMore(arr.length >= limit);
    } catch {
      if (reset) setMarkets([]);
    } finally {
      setLoading(false);
    }
  }, [search, sort, offset]);

  useEffect(() => {
    fetchMarkets(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sort]);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 fade-in">
      <h1 className="text-2xl font-bold mb-6">Explore Markets</h1>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search markets..."
            className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-accent/50 transition-colors"
          />
        </div>

        <div className="flex gap-2">
          {/* Sort */}
          <div className="flex bg-card border border-border rounded-lg overflow-hidden">
            {SORTS.map((s) => (
              <button
                key={s.value}
                onClick={() => setSort(s.value)}
                className={cn(
                  "px-3 py-2 text-xs font-medium transition-colors",
                  sort === s.value ? "bg-accent/10 text-accent" : "text-text-muted hover:text-text"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex bg-card border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={cn("px-2.5 py-2 transition-colors", viewMode === "grid" ? "bg-accent/10 text-accent" : "text-text-muted")}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn("px-2.5 py-2 transition-colors", viewMode === "list" ? "bg-accent/10 text-accent" : "text-text-muted")}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading && markets.length === 0 ? (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[150px] skeleton rounded-xl" />
          ))}
        </div>
      ) : markets.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <p className="text-text-muted">No markets found</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {markets.map((m) => (
            <MarketCard key={`${m.platform}-${m.market_id}`} market={m} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {markets.map((m) => (
            <MarketCard key={`${m.platform}-${m.market_id}`} market={m} compact />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && markets.length > 0 && (
        <div className="text-center mt-8">
          <button
            onClick={() => fetchMarkets(false)}
            disabled={loading}
            className="px-6 py-2.5 bg-card border border-border rounded-lg text-sm font-medium hover:bg-card-hover transition-colors disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
