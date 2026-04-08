"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import PriceChart from "@/components/PriceChart";
import OrderBookViz from "@/components/OrderBookViz";
import TradePanel from "@/components/TradePanel";
import MarketCard from "@/components/MarketCard";
import { formatUsd, cn } from "@/lib/utils";

interface MarketData {
  title?: string;
  question?: string;
  description?: string;
  platform?: string;
  market_id?: string;
  outcomes?: { yes: number; no: number };
  volume?: number;
  volume_24h?: number;
  liquidity?: number;
  category?: string;
  end_date?: string;
  active?: boolean;
  status?: string;
  contract_address?: string;
}

interface RelatedMarket {
  market_id: string;
  platform: string;
  title?: string;
  question?: string;
  outcomes?: { yes: number; no: number };
}

export default function MarketPage({
  params,
}: {
  params: Promise<{ platform: string; marketId: string }>;
}) {
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

        // Fetch related markets using keywords
        const title = data.title || data.question || "";
        const keywords = title.split(" ").slice(0, 3).join(" ");
        if (keywords) {
          const relRes = await fetch(`/api/markets?platform=spredd&search=${encodeURIComponent(keywords)}&limit=5`);
          const relData = await relRes.json();
          setRelated(
            (Array.isArray(relData) ? relData : []).filter(
              (m: RelatedMarket) => m.market_id !== marketId
            ).slice(0, 4)
          );
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load market");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [platform, marketId]);

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        <div className="h-4 skeleton rounded w-32 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-48 skeleton rounded-xl" />
            <div className="h-64 skeleton rounded-xl" />
          </div>
          <div className="h-96 skeleton rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-16 text-center">
        <p className="text-red mb-2">{error || "Market not found"}</p>
        <Link href="/explore" className="text-accent text-sm hover:underline">Back to markets</Link>
      </div>
    );
  }

  const yesPct = Math.round((market.outcomes?.yes ?? 0.5) * 100);
  const noPct = Math.round((market.outcomes?.no ?? 0.5) * 100);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-text-muted mb-5">
        <Link href="/" className="hover:text-text transition-colors">Home</Link>
        <span>/</span>
        <Link href="/explore" className="hover:text-text transition-colors">Explore</Link>
        <span>/</span>
        <span className="text-text-secondary truncate max-w-[200px]">
          {market.title || market.question}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Market info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header card */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex-1">
                <h1 className="text-xl font-bold leading-snug mb-2">
                  {market.title || market.question}
                </h1>
                {market.description && (
                  <p className="text-sm text-text-secondary line-clamp-3">{market.description}</p>
                )}
                <div className="flex items-center gap-3 mt-3 text-xs text-text-muted">
                  <span className="capitalize px-2 py-0.5 bg-accent/10 text-accent rounded">{platform}</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded",
                    market.active !== false ? "bg-green-dim text-green" : "bg-red-dim text-red"
                  )}>
                    {market.active !== false ? "Active" : "Resolved"}
                  </span>
                  {market.category && <span>{market.category}</span>}
                </div>
              </div>
            </div>

            {/* Outcome cards */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-green-dim border border-green/20 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-green">{yesPct}%</div>
                <div className="text-xs text-text-muted mt-1">Yes</div>
              </div>
              <div className="bg-red-dim border border-red/20 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-red">{noPct}%</div>
                <div className="text-xs text-text-muted mt-1">No</div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Volume", value: formatUsd(market.volume) },
                { label: "24h Volume", value: formatUsd(market.volume_24h) },
                { label: "Liquidity", value: formatUsd(market.liquidity) },
                {
                  label: "End Date",
                  value: market.end_date
                    ? new Date(market.end_date).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })
                    : "TBD",
                },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-[10px] text-text-muted">{s.label}</div>
                  <div className="text-sm font-semibold">{s.value}</div>
                </div>
              ))}
            </div>

            {/* Contract link */}
            {market.contract_address && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-[10px] text-text-muted">Contract</div>
                <a
                  href={`https://basescan.org/address/${market.contract_address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent hover:underline font-mono"
                >
                  {market.contract_address}
                </a>
              </div>
            )}
          </div>

          {/* Price chart */}
          <PriceChart platform={platform} marketId={marketId} />

          {/* Order book */}
          <OrderBookViz platform={platform} marketId={marketId} />

          {/* Related markets */}
          {related.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3">Related Markets</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {related.map((m) => (
                  <MarketCard key={`${m.platform}-${m.market_id}`} market={m} compact />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Trade panel */}
        <div>
          <div className="sticky top-[72px]">
            <TradePanel
              platform={platform}
              marketId={marketId}
              outcomes={market.outcomes}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
