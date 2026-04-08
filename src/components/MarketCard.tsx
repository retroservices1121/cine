"use client";

import Link from "next/link";
import { formatUsd } from "@/lib/utils";

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
  wide?: boolean;
}

export default function MarketCard({ market, compact, wide }: MarketCardProps) {
  const yesPrice = market.outcomes?.yes ?? 0.5;
  const yesPct = Math.round(yesPrice * 100);

  const categoryColor = {
    awards: "text-tertiary",
    casting: "text-secondary",
    "box office": "text-primary",
  }[market.category?.toLowerCase() || ""] || "text-primary";

  if (compact) {
    return (
      <Link
        href={`/market/${market.platform}/${encodeURIComponent(market.market_id)}`}
        className="block bg-surface-container-low rounded-xl p-4 hover:bg-surface-container-high transition-all duration-300"
      >
        <p className="text-xs font-headline font-bold text-white line-clamp-2 mb-3 leading-snug">{market.title || market.question}</p>
        <div className="flex items-center justify-between">
          <span className="text-primary font-headline font-bold text-sm">{yesPct}%</span>
          <span className="text-white/30 text-[9px] uppercase tracking-[0.2em]">{formatUsd(market.volume)} vol</span>
        </div>
      </Link>
    );
  }

  if (wide) {
    return (
      <Link
        href={`/market/${market.platform}/${encodeURIComponent(market.market_id)}`}
        className="group relative flex flex-row bg-surface-container-low rounded-xl overflow-hidden hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-500 min-h-[280px]"
      >
        <div className="w-1/3 overflow-hidden relative bg-surface-container-high">
          {market.image_url ? (
            <img src={market.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-white/10 text-6xl">theaters</span>
            </div>
          )}
        </div>
        <div className="w-2/3 p-8 lg:p-10 flex flex-col">
          {market.category && (
            <div className="flex items-center gap-3 mb-4">
              <span className="text-tertiary text-[10px] font-bold uppercase tracking-[0.15em]" style={{ border: "1px solid rgba(212,198,160,0.2)", padding: "2px 8px", borderRadius: 4 }}>
                {market.category}
              </span>
            </div>
          )}
          <h3 className="font-headline font-bold text-2xl lg:text-3xl text-white mb-6 leading-tight tracking-tight">{market.title || market.question}</h3>
          <div className="mt-auto flex items-center justify-between">
            <div className="flex gap-8 lg:gap-12">
              <div>
                <span className="text-white/40 text-[10px] uppercase tracking-[0.2em] block mb-1">Volume</span>
                <p className="text-white font-headline font-bold text-xl">{formatUsd(market.volume)}</p>
              </div>
              <div>
                <span className="text-white/40 text-[10px] uppercase tracking-[0.2em] block mb-1">Probability</span>
                <p className="text-primary font-headline font-bold text-xl">{yesPct}%</p>
              </div>
            </div>
            <button className="noir-gradient text-on-primary px-6 lg:px-8 py-3 rounded-xl font-headline font-bold text-xs uppercase tracking-wider active:scale-95 transition-all">
              Take Position
            </button>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/market/${market.platform}/${encodeURIComponent(market.market_id)}`}
      className="group relative flex flex-col bg-surface-container-low rounded-xl overflow-hidden hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-500"
    >
      {/* Image area */}
      <div className="h-44 overflow-hidden relative bg-surface-container-high">
        {market.image_url ? (
          <img src={market.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface-container-high to-surface-container-low">
            <span className="material-symbols-outlined text-white/10 text-5xl">theaters</span>
          </div>
        )}
        {market.category && (
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg">
            <span className={`${categoryColor} text-[10px] font-bold uppercase tracking-[0.15em]`}>{market.category}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 lg:p-8 flex-1 flex flex-col">
        <h3 className="font-headline font-bold text-lg lg:text-xl text-white mb-6 leading-snug tracking-tight">
          {market.title || market.question}
        </h3>
        <div className="mt-auto">
          <div className="flex justify-between items-end mb-4">
            <div>
              <span className="text-white/40 text-[9px] uppercase tracking-[0.2em]">Volume</span>
              <p className="text-white font-headline font-bold text-lg">{formatUsd(market.volume)}</p>
            </div>
            <div className="text-right">
              <span className="text-white/40 text-[9px] uppercase tracking-[0.2em]">Yes Price</span>
              <p className="text-primary font-headline font-bold text-lg">${yesPrice.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="flex-1 bg-surface-container-highest text-primary py-3 rounded-xl font-bold text-xs uppercase text-center hover:bg-primary hover:text-on-primary transition-all">Yes</span>
            <span className="flex-1 bg-surface-container-highest text-secondary py-3 rounded-xl font-bold text-xs uppercase text-center hover:bg-secondary hover:text-on-secondary transition-all">No</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
