"use client";

import Link from "next/link";

interface MarketCardProps {
  market: {
    market_id: string;
    platform: string;
    title: string;
    question?: string;
    outcomes?: { yes: number; no: number };
    volume?: number;
    volume_24h?: number;
    liquidity?: number;
    category?: string;
    end_date?: string;
    image_url?: string;
  };
}

function formatUsd(n: number | undefined) {
  if (!n) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export default function MarketCard({ market }: MarketCardProps) {
  const yesProb = market.outcomes?.yes ?? 0.5;
  const noProb = market.outcomes?.no ?? 0.5;
  const yesPct = Math.round(yesProb * 100);
  const noPct = Math.round(noProb * 100);

  return (
    <Link
      href={`/market/${market.platform}/${encodeURIComponent(market.market_id)}`}
      className="block bg-card border border-border rounded-xl p-5 hover:bg-card-hover hover:border-accent/30 transition-all duration-200 fade-in"
    >
      <div className="flex items-start gap-3 mb-4">
        {market.image_url && (
          <img
            src={market.image_url}
            alt=""
            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm leading-snug line-clamp-2">
            {market.title || market.question}
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs text-muted capitalize">{market.platform}</span>
            {market.category && (
              <>
                <span className="text-border">|</span>
                <span className="text-xs text-muted">{market.category}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Probability bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-green font-semibold">Yes {yesPct}%</span>
          <span className="text-red font-semibold">No {noPct}%</span>
        </div>
        <div className="h-2 rounded-full bg-red/20 overflow-hidden">
          <div
            className="h-full rounded-full bg-green prob-bar"
            style={{ width: `${yesPct}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-muted">
        <div>
          <span className="text-foreground font-medium">{formatUsd(market.volume)}</span>{" "}
          vol
        </div>
        {market.volume_24h !== undefined && (
          <div>
            <span className="text-foreground font-medium">
              {formatUsd(market.volume_24h)}
            </span>{" "}
            24h
          </div>
        )}
        {market.liquidity !== undefined && (
          <div>
            <span className="text-foreground font-medium">
              {formatUsd(market.liquidity)}
            </span>{" "}
            liq
          </div>
        )}
        {market.end_date && (
          <div className="ml-auto">
            {new Date(market.end_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </div>
        )}
      </div>
    </Link>
  );
}
