"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { formatUsd, pnlSign, pnlColor, cn, relativeTime } from "@/lib/utils";

interface Position {
  id: string; platform: string; market_id: string; market_title?: string;
  outcome: string; token_amount: number; avg_entry_price: number;
  current_price: number; status: string; created_at: string;
}

interface Order {
  order_id: string; platform: string; market_id: string; market_title?: string;
  outcome: string; side: string; order_type: string; amount: number;
  filled_amount: number; price: number; status: string; created_at: string;
}

interface PnlData {
  total_realized: number; total_unrealized: number; total_pnl: number; positions_count: number;
}

interface UsageData {
  tier: string; total_trades: number; total_volume: number; total_fees: number;
}

type Tab = "positions" | "orders" | "history";

export default function PortfolioPage() {
  const { authenticated, user, login } = useAuth();
  const wallet = user?.wallet?.address;

  const [tab, setTab] = useState<Tab>("positions");
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pnl, setPnl] = useState<PnlData | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!wallet) return;
    setLoading(true);
    try {
      const [posRes, pnlRes, ordRes, usageRes] = await Promise.all([
        fetch(`/api/positions?wallet_address=${wallet}`).then((r) => r.json()),
        fetch(`/api/positions/pnl?wallet_address=${wallet}`).then((r) => r.json()),
        fetch(`/api/trade/orders?wallet_address=${wallet}`).then((r) => r.json()),
        fetch("/api/usage").then((r) => r.json()).catch(() => null),
      ]);
      setPositions(Array.isArray(posRes) ? posRes : posRes.positions || []);
      setPnl(pnlRes.total_pnl !== undefined ? pnlRes : null);
      setOrders(Array.isArray(ordRes) ? ordRes : []);
      setUsage(usageRes);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [wallet]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const cancelOrder = async (orderId: string) => {
    setCancellingId(orderId);
    try {
      await fetch(`/api/trade/orders/${orderId}`, { method: "DELETE" });
      setOrders((prev) => prev.filter((o) => o.order_id !== orderId));
    } catch { /* ignore */ } finally { setCancellingId(null); }
  };

  if (!authenticated) {
    return (
      <div className="px-6 lg:px-12 py-20 max-w-7xl mx-auto text-center fade-in">
        <h1 className="text-3xl font-headline font-bold text-white tracking-tight mb-3">My Portfolio</h1>
        <p className="text-white/40 mb-6">Connect your wallet to view positions and PNL</p>
        <button onClick={login} className="noir-gradient text-on-primary px-8 py-3 rounded-xl font-headline font-bold text-sm uppercase tracking-wider active:scale-95 transition-all">
          Connect Wallet
        </button>
      </div>
    );
  }

  const openPositions = positions.filter((p) => p.status === "open");
  const closedPositions = positions.filter((p) => p.status !== "open");
  const activeOrders = orders.filter((o) => ["open", "partial"].includes(o.status));

  return (
    <div className="px-6 lg:px-12 py-8 lg:py-12 max-w-7xl mx-auto fade-in">
      <h1 className="text-3xl font-headline font-bold text-white tracking-tight mb-8">My Portfolio</h1>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {pnl && (
          <>
            <div className="bg-surface-container-low rounded-xl p-5">
              <div className="text-[10px] text-white/40 uppercase tracking-[0.15em] mb-1">Total PNL</div>
              <div className={cn("text-xl font-headline font-bold", pnlColor(pnl.total_pnl))}>{pnlSign(pnl.total_pnl)}</div>
            </div>
            <div className="bg-surface-container-low rounded-xl p-5">
              <div className="text-[10px] text-white/40 uppercase tracking-[0.15em] mb-1">Realized</div>
              <div className={cn("text-lg font-headline font-bold", pnlColor(pnl.total_realized))}>{pnlSign(pnl.total_realized)}</div>
            </div>
            <div className="bg-surface-container-low rounded-xl p-5">
              <div className="text-[10px] text-white/40 uppercase tracking-[0.15em] mb-1">Unrealized</div>
              <div className={cn("text-lg font-headline font-bold", pnlColor(pnl.total_unrealized))}>{pnlSign(pnl.total_unrealized)}</div>
            </div>
          </>
        )}
        {usage && (
          <>
            <div className="bg-surface-container-low rounded-xl p-5">
              <div className="text-[10px] text-white/40 uppercase tracking-[0.15em] mb-1">Total Trades</div>
              <div className="text-lg font-headline font-bold">{usage.total_trades}</div>
            </div>
            <div className="bg-surface-container-low rounded-xl p-5">
              <div className="text-[10px] text-white/40 uppercase tracking-[0.15em] mb-1">Volume</div>
              <div className="text-lg font-headline font-bold">{formatUsd(usage.total_volume)}</div>
            </div>
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 bg-surface-container-low rounded-full p-1 mb-6 w-fit">
        {([
          { key: "positions" as Tab, label: `Positions (${openPositions.length})` },
          { key: "orders" as Tab, label: `Orders (${activeOrders.length})` },
          { key: "history" as Tab, label: "History" },
        ]).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn("px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-full transition-all",
              tab === t.key ? "bg-primary text-on-primary" : "text-white/40 hover:text-white"
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 skeleton rounded-xl" />)}
        </div>
      ) : (
        <>
          {tab === "positions" && (
            <div className="space-y-3">
              {openPositions.length === 0 ? (
                <div className="text-center py-12 bg-surface-container-low rounded-xl">
                  <p className="text-white/40 mb-2">No open positions</p>
                  <Link href="/explore" className="text-primary text-sm hover:underline">Browse markets</Link>
                </div>
              ) : openPositions.map((pos) => {
                const pl = (pos.current_price - pos.avg_entry_price) * pos.token_amount;
                return (
                  <Link key={pos.id} href={`/market/${pos.platform}/${encodeURIComponent(pos.market_id)}`}
                    className="block bg-surface-container-low rounded-xl p-5 hover:bg-surface-container-high transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-headline font-medium text-white truncate">{pos.market_title || pos.market_id}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-white/40">
                          <span className={cn("font-bold", pos.outcome === "yes" ? "text-primary" : "text-secondary")}>
                            {pos.outcome.toUpperCase()}
                          </span>
                          <span>{pos.token_amount.toFixed(2)} shares</span>
                          <span>Avg: {(pos.avg_entry_price * 100).toFixed(1)}¢</span>
                          <span>Now: {(pos.current_price * 100).toFixed(1)}¢</span>
                        </div>
                      </div>
                      <div className={cn("text-sm font-headline font-bold", pnlColor(pl))}>{pnlSign(pl)}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {tab === "orders" && (
            <div className="space-y-3">
              {activeOrders.length === 0 ? (
                <div className="text-center py-12 bg-surface-container-low rounded-xl">
                  <p className="text-white/40">No active orders</p>
                </div>
              ) : (
                <div className="bg-surface-container-low rounded-xl overflow-hidden">
                  <div className="hidden sm:grid grid-cols-8 gap-3 px-4 py-2.5 bg-surface-container text-[10px] text-white/40 uppercase tracking-[0.15em] font-medium">
                    <div className="col-span-2">Market</div>
                    <div>Type</div><div>Side</div><div>Price</div><div>Amount</div><div>Status</div><div>Action</div>
                  </div>
                  {activeOrders.map((order) => (
                    <div key={order.order_id} className="grid grid-cols-1 sm:grid-cols-8 gap-2 sm:gap-3 px-4 py-3" style={{ borderTop: "1px solid rgba(64,71,83,0.15)" }}>
                      <div className="sm:col-span-2 text-xs text-white truncate">{order.market_title || order.market_id}</div>
                      <div className="text-xs capitalize text-white/40">{order.order_type}</div>
                      <div className={cn("text-xs font-bold", order.side === "buy" ? "text-primary" : "text-secondary")}>{order.side.toUpperCase()}</div>
                      <div className="text-xs font-mono text-white">{(order.price * 100).toFixed(1)}¢</div>
                      <div className="text-xs font-mono text-white">{formatUsd(order.amount)}</div>
                      <div className="text-xs capitalize text-white/40">{order.status}</div>
                      <div>
                        <button onClick={(e) => { e.preventDefault(); cancelOrder(order.order_id); }}
                          disabled={cancellingId === order.order_id}
                          className="text-xs text-secondary hover:text-secondary/80 transition-colors disabled:opacity-50">
                          {cancellingId === order.order_id ? "..." : "Cancel"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "history" && (
            <div className="space-y-3">
              {closedPositions.length === 0 ? (
                <div className="text-center py-12 bg-surface-container-low rounded-xl">
                  <p className="text-white/40">No closed positions</p>
                </div>
              ) : closedPositions.map((pos) => {
                const pl = (pos.current_price - pos.avg_entry_price) * pos.token_amount;
                return (
                  <div key={pos.id} className="bg-surface-container-low rounded-xl p-5 opacity-70">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-headline font-medium text-white truncate">{pos.market_title || pos.market_id}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-white/40">
                          <span className={cn("font-bold", pos.outcome === "yes" ? "text-primary" : "text-secondary")}>{pos.outcome.toUpperCase()}</span>
                          <span>{pos.token_amount.toFixed(2)} shares</span>
                          <span>{relativeTime(pos.created_at)}</span>
                        </div>
                      </div>
                      <div className={cn("text-sm font-headline font-bold", pnlColor(pl))}>{pnlSign(pl)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
