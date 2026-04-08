"use client";

import Link from "next/link";
import { formatUsd, formatPct, priceColor } from "@/lib/utils";

interface MarketCardProps {
  market: {
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
  };
  compact?: boolean;
}

const PLATFORM_COLORS: Record<string, string> = {
  spredd: "bg-accent/15 text-accent",
  polymarket: "bg-blue-500/15 text-blue-400",
  kalshi: "bg-emerald-500/15 text-emerald-400",
  limitless: "bg-purple-500/15 text-purple-400",
  myriad: "bg-pink-500/15 text-pink-400",
  opinion: "bg-orange-500/15 text-orange-400",
};

export default function MarketCard({ market, compact }: MarketCardProps) {
  const yesPrice = market.outcomes?.yes ?? 0.5;
  const noPrice = market.outcomes?.no ?? 0.5;
  const yesPct = Math.round(yesPrice * 100);

  if (compact) {
    return (
      <Link
        href={`/market/${market.platform}/${encodeURIComponent(market.market_id)}`}
        className="block bg-card border border-border rounded-lg p-3 hover:bg-card-hover hover:border-border-hover transition-all"
      >
        <p className="text-xs font-medium line-clamp-2 mb-2 leading-relaxed">
          {market.title || market.question}
        </p>
        <div className="flex items-center justify-between">
          <span className={`text-sm font-bold ${priceColor(yesPrice)}`}>
            {formatPct(yesPrice)}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${PLATFORM_COLORS[market.platform] || "bg-card-hover text-text-muted"}`}>
            {market.platform}
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/market/${market.platform}/${encodeURIComponent(market.market_id)}`}
      className="group block bg-card border border-border rounded-xl p-4 hover:bg-card-hover hover:border-border-hover transition-all duration-150 fade-in"
    >
      <div className="flex items-start gap-3 mb-3">
        {market.image_url ? (
          <img src={market.image_url} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-bg-secondary flex items-center justify-center shrink-0">
            <span className="text-text-muted text-xs font-bold">
              {(market.title || market.question || "?")[0].toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-accent transition-colors">
            {market.title || market.question}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${PLATFORM_COLORS[market.platform] || "bg-card-hover text-text-muted"}`}>
              {market.platform}
            </span>
            {market.category && (
              <span className="text-[10px] text-text-muted">{market.category}</span>
            )}
          </div>
        </div>
        {/* Price badge */}
        <div className={`text-right shrink-0 ${priceColor(yesPrice)}`}>
          <div className="text-lg font-bold">{yesPct}%</div>
          <div className="text-[10px] text-text-muted">Yes</div>
        </div>
      </div>

      {/* Probability bar */}
      <div className="mb-3">
        <div className="h-1.5 rounded-full bg-red/15 overflow-hidden">
          <div
            className="h-full rounded-full bg-green transition-all duration-500"
            style={{ width: `${yesPct}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-[11px] text-text-muted">
        {market.volume != null && (
          <span>{formatUsd(market.volume)} vol</span>
        )}
        {market.volume_24h != null && (
          <span>{formatUsd(market.volume_24h)} 24h</span>
        )}
        {market.liquidity != null && (
          <span>{formatUsd(market.liquidity)} liq</span>
        )}
        {market.end_date && (
          <span className="ml-auto">
            {new Date(market.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}
      </div>
    </Link>
  );
}
