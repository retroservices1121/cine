"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MarketCard from "@/components/MarketCard";
import Link from "next/link";
import { formatUsd } from "@/lib/utils";

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

interface ArbitrageOpp {
  market_title: string;
  outcome: string;
  buy_platform: string;
  buy_price: number;
  sell_platform: string;
  sell_price: number;
  spread: number;
  spread_pct: number;
}

export default function HomePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [trending, setTrending] = useState<Market[]>([]);
  const [searchResults, setSearchResults] = useState<Market[] | null>(null);
  const [arbs, setArbs] = useState<ArbitrageOpp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/markets?platform=spredd&sort=volume&limit=12").then((r) => r.json()),
      fetch("/api/arbitrage").then((r) => r.json()).catch(() => []),
    ]).then(([markets, arbitrage]) => {
      setTrending(Array.isArray(markets) ? markets : []);
      setArbs(Array.isArray(arbitrage) ? arbitrage.slice(0, 3) : []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!search.trim()) { setSearchResults(null); return; }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/markets?platform=spredd&search=${encodeURIComponent(search)}&limit=10`);
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) router.push(`/explore?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div className="fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent" />
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-16 pb-12 relative">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
              Predict the Future
            </h1>
            <p className="text-text-secondary text-base sm:text-lg">
              Trade on real-world outcomes. Custom prediction markets on Base chain.
            </p>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search prediction markets..."
              className="w-full bg-card border border-border rounded-xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
            />
            {/* Search results dropdown */}
            {searchResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl overflow-hidden shadow-2xl z-50">
                {searchResults.length === 0 ? (
                  <p className="p-4 text-sm text-text-muted text-center">No markets found</p>
                ) : (
                  searchResults.map((m) => (
                    <Link
                      key={`${m.platform}-${m.market_id}`}
                      href={`/market/${m.platform}/${encodeURIComponent(m.market_id)}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-card-hover transition-colors border-b border-border last:border-0"
                      onClick={() => { setSearch(""); setSearchResults(null); }}
                    >
                      <span className="text-sm truncate flex-1">{m.title || m.question}</span>
                      <span className={`text-sm font-bold ml-3 ${
                        (m.outcomes?.yes ?? 0.5) > 0.7 ? "text-green" :
                        (m.outcomes?.yes ?? 0.5) < 0.3 ? "text-red" : "text-text-secondary"
                      }`}>
                        {Math.round((m.outcomes?.yes ?? 0.5) * 100)}%
                      </span>
                    </Link>
                  ))
                )}
              </div>
            )}
          </form>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-12">
        {/* Arbitrage banner */}
        {arbs.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber animate-pulse" />
                Hot Arbitrage
              </h2>
              <Link href="/arbitrage" className="text-xs text-accent hover:text-accent-hover transition-colors">
                View all
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {arbs.map((a, i) => (
                <div key={i} className="bg-card border border-amber/20 rounded-xl p-4 hover:border-amber/40 transition-colors">
                  <p className="text-xs font-medium line-clamp-2 mb-3">{a.market_title}</p>
                  <div className="flex items-center justify-between text-[11px]">
                    <div>
                      <span className="text-text-muted">Buy </span>
                      <span className="text-green font-medium">{a.buy_platform}</span>
                      <span className="text-text-muted"> @ {(a.buy_price * 100).toFixed(0)}¢</span>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-dim rounded-full text-amber font-bold text-[11px]">
                      +{(a.spread_pct * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-[11px] mt-1">
                    <span className="text-text-muted">Sell </span>
                    <span className="text-red font-medium">{a.sell_platform}</span>
                    <span className="text-text-muted"> @ {(a.sell_price * 100).toFixed(0)}¢</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Trending Markets */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Trending Markets</h2>
            <Link href="/explore" className="text-xs text-accent hover:text-accent-hover transition-colors">
              Explore all
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[160px] skeleton rounded-xl" />
              ))}
            </div>
          ) : trending.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-xl">
              <p className="text-text-muted mb-2">No markets yet</p>
              <Link href="/dashboard" className="text-accent text-sm hover:underline">
                Create your first market
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trending.map((m) => (
                <MarketCard key={`${m.platform}-${m.market_id}`} market={m} />
              ))}
            </div>
          )}
        </section>

        {/* Stats */}
        <section className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Markets", value: trending.length.toString() },
            { label: "Total Volume", value: formatUsd(trending.reduce((s, m) => s + (m.volume || 0), 0)) },
            { label: "Chain", value: "Base" },
            { label: "Model", value: "Parimutuel" },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
              <div className="text-xl font-bold">{s.value}</div>
              <div className="text-[11px] text-text-muted mt-1">{s.label}</div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
