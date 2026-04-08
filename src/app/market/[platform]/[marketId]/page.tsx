"use client";

import { use } from "react";
import { useMarketDetail } from "@/hooks/useSpredd";
import TradePanel from "@/components/TradePanel";
import Link from "next/link";

interface MarketData {
  title?: string;
  question?: string;
  platform?: string;
  market_id?: string;
  outcomes?: { yes: number; no: number };
  volume?: number;
  volume_24h?: number;
  liquidity?: number;
  category?: string;
  end_date?: string;
  active?: boolean;
  contract_address?: string;
}

interface OrderBookData {
  bids?: { price: number; size: number }[];
  asks?: { price: number; size: number }[];
  spread?: number;
}

function formatUsd(n: number | undefined) {
  if (!n) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

export default function MarketPage({
  params,
}: {
  params: Promise<{ platform: string; marketId: string }>;
}) {
  const { platform, marketId } = use(params);
  const { data, isLoading, error } = useMarketDetail(platform, marketId);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-card rounded w-1/3" />
          <div className="h-4 bg-card rounded w-1/2" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            <div className="lg:col-span-2 h-64 bg-card rounded-xl" />
            <div className="h-96 bg-card rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <p className="text-red">
          {error instanceof Error ? error.message : "Market not found"}
        </p>
        <Link href="/" className="text-accent hover:underline text-sm mt-2 inline-block">
          Back to markets
        </Link>
      </div>
    );
  }

  const market = data.market as MarketData;
  const orderbook = data.orderbook as OrderBookData | null;
  const yesPct = Math.round((market.outcomes?.yes ?? 0.5) * 100);
  const noPct = Math.round((market.outcomes?.no ?? 0.5) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/" className="hover:text-foreground transition-colors">
          Markets
        </Link>
        <span>/</span>
        <span className="capitalize">{platform}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Market info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h1 className="text-xl font-bold mb-3">
              {market.title || market.question}
            </h1>

            {/* Big probability display */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green/5 border border-green/20 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-green">{yesPct}%</div>
                <div className="text-sm text-muted mt-1">Yes</div>
              </div>
              <div className="bg-red/5 border border-red/20 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-red">{noPct}%</div>
                <div className="text-sm text-muted mt-1">No</div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-muted mb-1">Volume</div>
                <div className="font-semibold">{formatUsd(market.volume)}</div>
              </div>
              <div>
                <div className="text-xs text-muted mb-1">24h Volume</div>
                <div className="font-semibold">
                  {formatUsd(market.volume_24h)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted mb-1">Liquidity</div>
                <div className="font-semibold">{formatUsd(market.liquidity)}</div>
              </div>
              <div>
                <div className="text-xs text-muted mb-1">End Date</div>
                <div className="font-semibold">
                  {market.end_date
                    ? new Date(market.end_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "TBD"}
                </div>
              </div>
            </div>
          </div>

          {/* Order Book */}
          {orderbook && (
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Order Book</h2>
                {orderbook.spread !== undefined && (
                  <span className="text-xs text-muted">
                    Spread: {(orderbook.spread * 100).toFixed(2)}%
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Bids */}
                <div>
                  <div className="text-xs text-muted mb-2 flex justify-between px-2">
                    <span>Price</span>
                    <span>Size</span>
                  </div>
                  <div className="space-y-0.5">
                    {(orderbook.bids || []).slice(0, 10).map((bid, i) => (
                      <div
                        key={i}
                        className="flex justify-between px-2 py-1 text-sm font-mono relative"
                      >
                        <div
                          className="absolute inset-0 bg-green/5 rounded"
                          style={{
                            width: `${Math.min(bid.size * 2, 100)}%`,
                          }}
                        />
                        <span className="relative text-green">
                          {bid.price.toFixed(2)}
                        </span>
                        <span className="relative text-muted">
                          {bid.size.toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Asks */}
                <div>
                  <div className="text-xs text-muted mb-2 flex justify-between px-2">
                    <span>Price</span>
                    <span>Size</span>
                  </div>
                  <div className="space-y-0.5">
                    {(orderbook.asks || []).slice(0, 10).map((ask, i) => (
                      <div
                        key={i}
                        className="flex justify-between px-2 py-1 text-sm font-mono relative"
                      >
                        <div
                          className="absolute inset-0 bg-red/5 rounded"
                          style={{
                            width: `${Math.min(ask.size * 2, 100)}%`,
                          }}
                        />
                        <span className="relative text-red">
                          {ask.price.toFixed(2)}
                        </span>
                        <span className="relative text-muted">
                          {ask.size.toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Market info */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-semibold mb-3">Market Info</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Platform</span>
                <span className="capitalize">{market.platform}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Category</span>
                <span className="capitalize">{market.category || "General"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Status</span>
                <span className={market.active ? "text-green" : "text-red"}>
                  {market.active ? "Active" : "Resolved"}
                </span>
              </div>
              {market.contract_address && (
                <div className="flex justify-between col-span-2">
                  <span className="text-muted">Contract</span>
                  <a
                    href={`https://basescan.org/address/${market.contract_address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline font-mono text-xs"
                  >
                    {market.contract_address.slice(0, 8)}...
                    {market.contract_address.slice(-6)}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Trade panel */}
        <div>
          <div className="sticky top-20">
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
