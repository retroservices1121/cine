"use client";

import { useState, useEffect, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface PriceChartProps {
  platform: string;
  marketId: string;
}

const INTERVALS = [
  { label: "1H", value: "1m" },
  { label: "6H", value: "5m" },
  { label: "24H", value: "1h" },
  { label: "7D", value: "1h" },
  { label: "30D", value: "1d" },
  { label: "ALL", value: "1d" },
];

interface DataPoint {
  timestamp: string;
  price: number;
  time: string;
  pct: number;
}

export default function PriceChart({ platform, marketId }: PriceChartProps) {
  const [activeInterval, setActiveInterval] = useState(2); // 24H default
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const interval = INTERVALS[activeInterval].value;
      const res = await fetch(
        `/api/markets/${platform}/${encodeURIComponent(marketId)}/history?interval=${interval}`
      );
      if (!res.ok) throw new Error();
      const json = await res.json();
      const points = (json.prices || []).map((p: { timestamp: string; price: number }) => ({
        ...p,
        time: new Date(p.timestamp).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        pct: Math.round(p.price * 100),
      }));
      setData(points);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [platform, marketId, activeInterval]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const trendUp = data.length >= 2 && data[data.length - 1].price >= data[0].price;
  const color = trendUp ? "#22c55e" : "#ef4444";

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Price History</h3>
        <div className="flex gap-0.5 bg-bg rounded-md p-0.5">
          {INTERVALS.map((iv, i) => (
            <button
              key={iv.label}
              onClick={() => setActiveInterval(i)}
              className={cn(
                "px-2 py-1 text-[11px] font-medium rounded transition-colors",
                i === activeInterval
                  ? "bg-card text-text"
                  : "text-text-muted hover:text-text"
              )}
            >
              {iv.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-[200px] skeleton rounded-lg" />
      ) : data.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center text-text-muted text-xs">
          No price history available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              tick={{ fill: "#71717a", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#71717a", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v}%`}
              width={40}
            />
            <Tooltip
              contentStyle={{
                background: "#16161a",
                border: "1px solid #27272a",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "#a1a1aa" }}
              formatter={(value) => [`${value}%`, "Yes"]}
            />
            <Area
              type="monotone"
              dataKey="pct"
              stroke={color}
              strokeWidth={2}
              fill="url(#priceGrad)"
              dot={false}
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
