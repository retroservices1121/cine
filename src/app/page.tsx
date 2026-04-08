"use client";

import { useState } from "react";
import { useMarkets } from "@/hooks/useSpredd";
import MarketCard from "@/components/MarketCard";

const CATEGORIES = [
  "All",
  "Politics",
  "Crypto",
  "Sports",
  "Entertainment",
  "Science",
  "Economics",
];

const PLATFORMS = [
  { value: "", label: "All Platforms" },
  { value: "spredd", label: "Spredd (Custom)" },
  { value: "polymarket", label: "Polymarket" },
  { value: "kalshi", label: "Kalshi" },
  { value: "limitless", label: "Limitless" },
];

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [platform, setPlatform] = useState("");
  const [sort, setSort] = useState("volume");

  const { data: markets, isLoading, error } = useMarkets({
    search: search || undefined,
    category: category || undefined,
    platform: platform || undefined,
    sort,
    limit: 40,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Prediction Markets</h1>
        <p className="text-muted">
          Trade on outcomes. Create custom markets on Base chain.
        </p>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search markets..."
            className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="bg-card border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors cursor-pointer"
        >
          {PLATFORMS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="bg-card border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors cursor-pointer"
        >
          <option value="volume">Volume</option>
          <option value="liquidity">Liquidity</option>
          <option value="newest">Newest</option>
          <option value="ending_soon">Ending Soon</option>
        </select>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat === "All" ? "" : cat.toLowerCase())}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              (cat === "All" && !category) || category === cat.toLowerCase()
                ? "bg-accent text-white"
                : "bg-card border border-border text-muted hover:text-foreground hover:border-accent/50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Market grid */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-xl p-5 animate-pulse"
            >
              <div className="h-4 bg-card-hover rounded w-3/4 mb-3" />
              <div className="h-3 bg-card-hover rounded w-1/2 mb-4" />
              <div className="h-2 bg-card-hover rounded-full mb-3" />
              <div className="h-3 bg-card-hover rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-red text-sm">
            {error instanceof Error ? error.message : "Failed to load markets"}
          </p>
        </div>
      )}

      {markets && (
        <>
          {(markets as unknown[]).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted">No markets found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(markets as Record<string, unknown>[]).map((m) => (
                <MarketCard key={`${m.platform}-${m.market_id}`} market={m as never} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
