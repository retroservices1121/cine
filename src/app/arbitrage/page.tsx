"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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

export default function ArbitragePage() {
  const [opps, setOpps] = useState<ArbitrageOpp[]>([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(30);

  const fetchArbitrage = useCallback(async () => {
    try {
      const res = await fetch("/api/arbitrage");
      const data = await res.json();
      setOpps(Array.isArray(data) ? data : []);
    } catch {
      setOpps([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArbitrage();
    const refresh = setInterval(() => {
      fetchArbitrage();
      setCountdown(30);
    }, 30000);
    const tick = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => { clearInterval(refresh); clearInterval(tick); };
  }, [fetchArbitrage]);

  const totalSpread = opps.reduce((s, o) => s + o.spread_pct, 0);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Arbitrage</h1>
          <p className="text-text-muted text-sm mt-1">
            Cross-platform price differences
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-text-muted">
            Refresh in {countdown}s
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-2xl font-bold text-amber">{opps.length}</div>
          <div className="text-[11px] text-text-muted">Opportunities</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-2xl font-bold">{(totalSpread * 100).toFixed(1)}%</div>
          <div className="text-[11px] text-text-muted">Total Spread</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 hidden sm:block">
          <div className="text-2xl font-bold">{opps.filter((o) => o.spread_pct > 0.05).length}</div>
          <div className="text-[11px] text-text-muted">High Spread (&gt;5%)</div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 skeleton rounded-xl" />
          ))}
        </div>
      ) : opps.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <p className="text-text-muted">No arbitrage opportunities right now</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-3 bg-bg-secondary text-[10px] text-text-muted uppercase tracking-wider font-medium">
            <div className="col-span-4">Market</div>
            <div className="col-span-2">Buy</div>
            <div className="col-span-2">Sell</div>
            <div className="col-span-2">Spread</div>
            <div className="col-span-2">Action</div>
          </div>
          {/* Rows */}
          {opps
            .sort((a, b) => b.spread_pct - a.spread_pct)
            .map((opp, i) => (
            <div
              key={i}
              className={cn(
                "grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 px-4 py-3 border-t border-border hover:bg-card-hover transition-colors",
                opp.spread_pct > 0.05 && "bg-amber-dim/30"
              )}
            >
              <div className="sm:col-span-4">
                <p className="text-sm font-medium line-clamp-1">{opp.market_title}</p>
                <span className="text-[10px] text-text-muted capitalize">{opp.outcome}</span>
              </div>
              <div className="sm:col-span-2 flex sm:block items-center gap-2">
                <span className="text-xs text-text-muted sm:hidden">Buy: </span>
                <span className="text-xs capitalize text-green">{opp.buy_platform}</span>
                <span className="text-xs font-mono ml-1">{(opp.buy_price * 100).toFixed(1)}¢</span>
              </div>
              <div className="sm:col-span-2 flex sm:block items-center gap-2">
                <span className="text-xs text-text-muted sm:hidden">Sell: </span>
                <span className="text-xs capitalize text-red">{opp.sell_platform}</span>
                <span className="text-xs font-mono ml-1">{(opp.sell_price * 100).toFixed(1)}¢</span>
              </div>
              <div className="sm:col-span-2">
                <span className={cn(
                  "inline-flex px-2 py-0.5 rounded-full text-xs font-bold",
                  opp.spread_pct > 0.05 ? "bg-amber-dim text-amber" : "bg-green-dim text-green"
                )}>
                  +{(opp.spread_pct * 100).toFixed(1)}%
                </span>
              </div>
              <div className="sm:col-span-2">
                <Link
                  href={`/market/${opp.buy_platform}/${encodeURIComponent(opp.market_title)}`}
                  className="text-xs text-accent hover:text-accent-hover transition-colors"
                >
                  Trade
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
