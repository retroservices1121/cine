"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import MarketCard from "@/components/MarketCard";
import { cn } from "@/lib/utils";

interface Market {
  market_id: string; platform: string; title?: string; question?: string;
  outcomes?: { yes: number; no: number }; volume?: number; volume_24h?: number;
  liquidity?: number; category?: string; end_date?: string; image_url?: string;
}

const SORTS = [
  { value: "volume", label: "Volume" },
  { value: "newest", label: "Newest" },
  { value: "ending_soon", label: "Ending Soon" },
];

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="px-6 lg:px-12 py-8 max-w-7xl mx-auto"><div className="h-10 skeleton rounded-xl w-48 mb-8" /><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">{Array.from({length:6}).map((_,i)=><div key={i} className="h-[350px] skeleton rounded-xl"/>)}</div></div>}>
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
  const limit = 24;

  const fetchMarkets = useCallback(async (reset = false) => {
    const newOffset = reset ? 0 : offset;
    setLoading(true);
    try {
      const params = new URLSearchParams({ platform: "spredd", sort_by: sort, limit: String(limit), offset: String(newOffset) });
      if (search) params.set("search", search);
      const res = await fetch(`/api/markets?${params}`);
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];
      if (reset) { setMarkets(arr); setOffset(limit); } else { setMarkets((prev) => [...prev, ...arr]); setOffset(newOffset + limit); }
      setHasMore(arr.length >= limit);
    } catch { if (reset) setMarkets([]); }
    finally { setLoading(false); }
  }, [search, sort, offset]);

  useEffect(() => { fetchMarkets(true); }, [search, sort]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="px-6 lg:px-12 py-8 lg:py-12 max-w-7xl mx-auto fade-in">
      <h1 className="text-3xl lg:text-4xl font-headline font-bold text-white tracking-tight mb-8">Explore Markets</h1>

      <div className="flex flex-col sm:flex-row gap-4 mb-10">
        <div className="relative flex-1 group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-[18px] group-focus-within:text-primary transition-colors">search</span>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search markets..."
            className="w-full bg-surface-container-high border-none rounded-xl pl-11 pr-6 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-primary transition-all" />
        </div>
        <div className="flex items-center gap-2 p-1 bg-surface-container-low rounded-full">
          {SORTS.map((s) => (
            <button key={s.value} onClick={() => setSort(s.value)}
              className={cn("px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all",
                sort === s.value ? "bg-primary text-on-primary" : "text-white/40 hover:text-white"
              )}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {loading && markets.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-[350px] skeleton rounded-xl" />)}
        </div>
      ) : markets.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-low rounded-xl">
          <p className="text-white/40 font-headline text-lg">No markets found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {markets.map((m) => <MarketCard key={`${m.platform}-${m.market_id}`} market={m} />)}
        </div>
      )}

      {hasMore && markets.length > 0 && (
        <div className="text-center mt-10">
          <button onClick={() => fetchMarkets(false)} disabled={loading}
            className="px-8 py-3 bg-surface-container-highest text-white rounded-xl text-sm font-headline font-bold uppercase tracking-wider hover:bg-surface-bright transition-all disabled:opacity-30">
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
