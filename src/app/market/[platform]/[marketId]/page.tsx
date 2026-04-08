"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import PriceChart from "@/components/PriceChart";
import OrderBookViz from "@/components/OrderBookViz";
import TradePanel from "@/components/TradePanel";
import MarketCard from "@/components/MarketCard";
import { formatUsd } from "@/lib/utils";

interface MarketData {
  title?: string; question?: string; description?: string; platform?: string; market_id?: string;
  outcomes?: { yes: number; no: number }; volume?: number; volume_24h?: number; liquidity?: number;
  category?: string; end_date?: string; active?: boolean; status?: string; contract_address?: string; image_url?: string;
}

interface RelatedMarket {
  market_id: string; platform: string; title?: string; question?: string; outcomes?: { yes: number; no: number };
}

export default function MarketPage({ params }: { params: Promise<{ platform: string; marketId: string }> }) {
  const { platform, marketId } = use(params);
  const [market, setMarket] = useState<MarketData | null>(null);
  const [related, setRelated] = useState<RelatedMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/markets/${platform}/${encodeURIComponent(marketId)}`);
        if (!res.ok) throw new Error("Market not found");
        const data = await res.json();
        setMarket(data);
        const title = data.title || data.question || "";
        const keywords = title.split(" ").slice(0, 3).join(" ");
        if (keywords) {
          const relRes = await fetch(`/api/markets?platform=spredd&search=${encodeURIComponent(keywords)}&limit=5`);
          const relData = await relRes.json();
          setRelated((Array.isArray(relData) ? relData : []).filter((m: RelatedMarket) => m.market_id !== marketId).slice(0, 4));
        }
      } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed to load"); }
      finally { setLoading(false); }
    }
    fetchData();
  }, [platform, marketId]);

  if (loading) return (
    <div className="px-6 lg:px-12 py-8 max-w-7xl mx-auto">
      <div className="h-[350px] skeleton rounded-xl mb-8" />
      <div className="grid grid-cols-12 gap-8"><div className="col-span-8 h-[400px] skeleton rounded-xl" /><div className="col-span-4 h-[500px] skeleton rounded-xl" /></div>
    </div>
  );

  if (error || !market) return (
    <div className="px-6 lg:px-12 py-16 text-center">
      <p className="text-error mb-2">{error || "Market not found"}</p>
      <Link href="/" className="text-primary text-sm hover:underline">Back to markets</Link>
    </div>
  );

  const yesPct = Math.round((market.outcomes?.yes ?? 0.5) * 100);

  return (
    <div className="fade-in">
      {/* Hero Header */}
      <header className="relative w-full h-[350px] lg:h-[400px] overflow-hidden rounded-none lg:mx-0">
        <div className="absolute inset-0 bg-gradient-to-br from-surface-container-low to-surface" />
        {market.image_url && <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${market.image_url})` }} />}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/50 to-transparent" />
        <div className="absolute bottom-8 lg:bottom-12 left-6 lg:left-12 max-w-3xl">
          <div className="flex gap-3 mb-4">
            {market.category && (
              <span className="px-3 py-1 bg-surface-container-highest text-white text-[10px] font-bold tracking-[0.15em] uppercase rounded-full">{market.category}</span>
            )}
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.15em] uppercase ${market.active !== false ? "bg-primary-container/20 text-primary" : "bg-secondary-container/20 text-secondary"}`}>
              {market.active !== false ? "Active" : "Resolved"}
            </span>
          </div>
          <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4 leading-[1.05] uppercase">
            {market.title || market.question}
          </h1>
          <div className="flex items-center gap-6 text-on-surface-variant font-label text-xs uppercase tracking-[0.15em]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[16px]">trending_up</span>
              <span>Volume: {formatUsd(market.volume)}</span>
            </div>
            {market.end_date && (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[16px]">schedule</span>
                <span>Closes: {new Date(market.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="px-6 lg:px-12 py-8 lg:py-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-12 gap-6 lg:gap-12">
          {/* Left */}
          <div className="col-span-12 lg:col-span-8 space-y-8 lg:space-y-12">
            {/* Probability + Chart */}
            <section className="bg-surface-container-low rounded-xl p-6 lg:p-8">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h3 className="text-white/50 font-label text-xs uppercase tracking-[0.15em] mb-1">Current Probability</h3>
                  <div className="text-4xl font-headline font-bold text-white">
                    {yesPct}%
                  </div>
                </div>
              </div>
              <PriceChart platform={platform} marketId={marketId} />
            </section>

            <OrderBookViz platform={platform} marketId={marketId} />

            {/* Market info */}
            {market.contract_address && (
              <div className="bg-surface-container-low rounded-xl p-6 lg:p-8">
                <h3 className="text-white/50 font-label text-xs uppercase tracking-[0.15em] mb-4">Contract</h3>
                <a href={`https://basescan.org/address/${market.contract_address}`} target="_blank" rel="noopener noreferrer"
                  className="text-primary text-sm font-mono hover:underline break-all">{market.contract_address}</a>
              </div>
            )}

            {related.length > 0 && (
              <section>
                <h3 className="font-headline font-bold text-white text-sm uppercase tracking-[0.15em] mb-6">Related Markets</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {related.map((m) => <MarketCard key={`${m.platform}-${m.market_id}`} market={m} compact />)}
                </div>
              </section>
            )}
          </div>

          {/* Right: Trade panel */}
          <div className="col-span-12 lg:col-span-4">
            <div className="sticky top-28">
              <TradePanel platform={platform} marketId={marketId} outcomes={market.outcomes} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
