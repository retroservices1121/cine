"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";

interface OrderBookVizProps {
  platform: string;
  marketId: string;
}

interface Level {
  price: number;
  size: number;
}

export default function OrderBookViz({ platform, marketId }: OrderBookVizProps) {
  const [bids, setBids] = useState<Level[]>([]);
  const [asks, setAsks] = useState<Level[]>([]);
  const [spread, setSpread] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchOB = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/markets/${platform}/${encodeURIComponent(marketId)}/orderbook`
      );
      if (!res.ok) throw new Error();
      const json = await res.json();
      setBids(json.bids || []);
      setAsks(json.asks || []);
      setSpread(json.spread || 0);
    } catch {
      setBids([]);
      setAsks([]);
    } finally {
      setLoading(false);
    }
  }, [platform, marketId]);

  useEffect(() => {
    fetchOB();
    const timer = setInterval(fetchOB, 15000);
    return () => clearInterval(timer);
  }, [fetchOB]);

  if (loading) {
    return (
      <div className="bg-surface-container-low rounded-xl p-6 lg:p-8">
        <div className="h-4 skeleton rounded w-24 mb-4" />
        <div className="h-[140px] skeleton rounded-xl" />
      </div>
    );
  }

  // Depth chart data: bids reversed + asks
  const depthData = [
    ...bids.slice(0, 8).reverse().map((b) => ({ price: b.price, bid: b.size, ask: 0 })),
    ...asks.slice(0, 8).map((a) => ({ price: a.price, bid: 0, ask: a.size })),
  ];

  const maxBid = Math.max(...bids.map((b) => b.size), 1);
  const maxAsk = Math.max(...asks.map((a) => a.size), 1);

  return (
    <div className="bg-surface-container-low rounded-xl p-6 lg:p-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Order Book</h3>
        <span className="text-[11px] text-text-muted">
          Spread: {(spread * 100).toFixed(2)}%
        </span>
      </div>

      {/* Depth chart */}
      {depthData.length > 0 && (
        <div className="mb-4">
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={depthData} barGap={0}>
              <XAxis
                dataKey="price"
                tick={{ fill: "#71717a", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${(v * 100).toFixed(0)}¢`}
              />
              <YAxis hide />
              <Bar dataKey="bid" radius={[2, 2, 0, 0]}>
                {depthData.map((_, i) => (
                  <Cell key={i} fill="rgba(34,197,94,0.3)" />
                ))}
              </Bar>
              <Bar dataKey="ask" radius={[2, 2, 0, 0]}>
                {depthData.map((_, i) => (
                  <Cell key={i} fill="rgba(239,68,68,0.3)" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Bid/Ask tables */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] text-text-muted mb-1.5 flex justify-between px-1">
            <span>Bid</span><span>Size</span>
          </div>
          {bids.slice(0, 8).map((b, i) => (
            <div key={i} className="flex justify-between px-1 py-0.5 text-[11px] font-mono relative">
              <div
                className="absolute inset-0 bg-green/5 rounded-sm"
                style={{ width: `${(b.size / maxBid) * 100}%` }}
              />
              <span className="relative text-green">{(b.price * 100).toFixed(1)}¢</span>
              <span className="relative text-text-muted">{b.size.toFixed(0)}</span>
            </div>
          ))}
          {bids.length === 0 && <p className="text-[10px] text-text-muted px-1">No bids</p>}
        </div>
        <div>
          <div className="text-[10px] text-text-muted mb-1.5 flex justify-between px-1">
            <span>Ask</span><span>Size</span>
          </div>
          {asks.slice(0, 8).map((a, i) => (
            <div key={i} className="flex justify-between px-1 py-0.5 text-[11px] font-mono relative">
              <div
                className="absolute inset-0 bg-red/5 rounded-sm right-0 left-auto"
                style={{ width: `${(a.size / maxAsk) * 100}%` }}
              />
              <span className="relative text-red">{(a.price * 100).toFixed(1)}¢</span>
              <span className="relative text-text-muted">{a.size.toFixed(0)}</span>
            </div>
          ))}
          {asks.length === 0 && <p className="text-[10px] text-text-muted px-1">No asks</p>}
        </div>
      </div>
    </div>
  );
}
