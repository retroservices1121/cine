"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MarketCard from "@/components/MarketCard";
import Link from "next/link";

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

export default function HomePage() {
  const router = useRouter();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Market[] | null>(null);

  useEffect(() => {
    fetch("/api/markets?platform=spredd&sort=volume&limit=12")
      .then((r) => r.json())
      .then((data) => { setMarkets(Array.isArray(data) ? data : []); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!search.trim()) { setSearchResults(null); return; }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/markets?platform=spredd&search=${encodeURIComponent(search)}&limit=8`);
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) router.push(`/explore?search=${encodeURIComponent(search.trim())}`);
  };

  const heroMarket = markets[0];
  const feedMarkets = markets.slice(1);

  return (
    <div className="fade-in">
      {/* Hero Featured Market */}
      <section className="relative w-full h-[500px] lg:h-[600px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-surface-container-low via-surface to-surface-container-lowest" />
        {heroMarket?.image_url && (
          <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url(${heroMarket.image_url})` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-surface via-transparent to-transparent" />

        <div className="relative h-full flex flex-col justify-end px-6 lg:px-12 pb-12 lg:pb-16 max-w-7xl mx-auto">
          {heroMarket ? (
            <>
              <div className="flex items-center gap-3 mb-4 lg:mb-6">
                {heroMarket.category && (
                  <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.15em]">
                    {heroMarket.category}
                  </span>
                )}
                {heroMarket.end_date && (
                  <span className="text-white/50 text-xs font-label tracking-[0.1em] uppercase">
                    Closes {new Date(heroMarket.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                )}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-headline font-bold text-white tracking-tighter max-w-4xl mb-6 leading-[0.95] uppercase">
                {heroMarket.title || heroMarket.question}
              </h1>
              <div className="flex items-center gap-6 lg:gap-8">
                <div>
                  <span className="text-white/40 text-[10px] uppercase tracking-[0.2em] block mb-1">Current Odds</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-primary text-3xl lg:text-4xl font-headline font-bold tracking-tight text-glow">
                      {Math.round((heroMarket.outcomes?.yes ?? 0.5) * 100)}%
                    </span>
                    <span className="text-white/50 text-sm font-label">Probability</span>
                  </div>
                </div>
                <div className="flex gap-3 items-center self-end">
                  <Link
                    href={`/market/${heroMarket.platform}/${encodeURIComponent(heroMarket.market_id)}`}
                    className="noir-gradient text-on-primary px-8 lg:px-10 py-3 lg:py-4 rounded-xl font-headline font-extrabold uppercase tracking-widest shadow-2xl hover:brightness-110 active:scale-95 transition-all text-sm"
                  >
                    Bet Yes
                  </Link>
                  <Link
                    href={`/market/${heroMarket.platform}/${encodeURIComponent(heroMarket.market_id)}`}
                    className="bg-surface-container-highest text-white px-8 lg:px-10 py-3 lg:py-4 rounded-xl font-headline font-extrabold uppercase tracking-widest hover:bg-surface-bright active:scale-95 transition-all text-sm"
                  >
                    Bet No
                  </Link>
                </div>
              </div>
            </>
          ) : loading ? (
            <div className="space-y-4">
              <div className="h-6 skeleton rounded w-48" />
              <div className="h-16 skeleton rounded w-[600px] max-w-full" />
              <div className="h-10 skeleton rounded w-64" />
            </div>
          ) : (
            <div className="text-center py-20">
              <h1 className="text-4xl font-headline font-bold text-white tracking-tighter mb-4">No Markets Yet</h1>
              <p className="text-white/50 mb-6">Create your first prediction market from the dashboard.</p>
              <Link href="/dashboard" className="noir-gradient text-on-primary px-8 py-3 rounded-xl font-headline font-bold text-sm uppercase tracking-wider">
                Go to Dashboard
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Market Feed */}
      <div className="px-6 lg:px-12 py-10 lg:py-12 max-w-7xl mx-auto">
        {/* Search + Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10 lg:mb-12">
          <div className="flex items-center gap-2 p-1 bg-surface-container-low rounded-full">
            <button className="bg-primary text-on-primary px-5 lg:px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider">All Markets</button>
          </div>
          <form onSubmit={handleSearch} className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-[18px]">search</span>
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search markets..."
              className="bg-surface-container-high border-none rounded-xl pl-11 pr-6 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-primary w-64 transition-all"
            />
            {searchResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-high rounded-xl overflow-hidden shadow-2xl z-50">
                {searchResults.length === 0 ? (
                  <p className="p-4 text-sm text-white/40 text-center">No markets found</p>
                ) : searchResults.map((m) => (
                  <Link key={`${m.platform}-${m.market_id}`}
                    href={`/market/${m.platform}/${encodeURIComponent(m.market_id)}`}
                    onClick={() => { setSearch(""); setSearchResults(null); }}
                    className="flex items-center justify-between px-4 py-3 hover:bg-surface-bright transition-colors">
                    <span className="text-sm text-white truncate flex-1">{m.title || m.question}</span>
                    <span className="text-primary font-headline font-bold text-sm ml-3">{Math.round((m.outcomes?.yes ?? 0.5) * 100)}%</span>
                  </Link>
                ))}
              </div>
            )}
          </form>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[350px] skeleton rounded-xl" />
            ))}
          </div>
        ) : feedMarkets.length === 0 ? null : (
          <div className="space-y-8">
            {/* Top 3 cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {feedMarkets.slice(0, 3).map((m) => (
                <MarketCard key={`${m.platform}-${m.market_id}`} market={m} />
              ))}
            </div>
            {/* Wide card */}
            {feedMarkets[3] && (
              <MarketCard market={feedMarkets[3]} wide />
            )}
            {/* Remaining */}
            {feedMarkets.length > 4 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {feedMarkets.slice(4).map((m) => (
                  <MarketCard key={`${m.platform}-${m.market_id}`} market={m} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
