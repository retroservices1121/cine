"use client";

import { useAuth } from "@/hooks/useAuth";
import { usePositions } from "@/hooks/useSpredd";
import Link from "next/link";

interface Position {
  id: string;
  platform: string;
  market_id: string;
  market_title?: string;
  outcome: string;
  token_amount: number;
  avg_entry_price: number;
  current_price: number;
  status: string;
  created_at: string;
}

interface PnlData {
  total_realized: number;
  total_unrealized: number;
  total_pnl: number;
  positions_count: number;
}

function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

function PnlBadge({ value }: { value: number }) {
  const isPos = value >= 0;
  return (
    <span
      className={`font-mono font-semibold ${isPos ? "text-green" : "text-red"}`}
    >
      {isPos ? "+" : ""}
      {formatUsd(value)}
    </span>
  );
}

export default function PortfolioPage() {
  const { authenticated, user, login } = useAuth();
  const walletAddress = user?.wallet?.address;

  const { data, isLoading, error } = usePositions(walletAddress);

  if (!authenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center fade-in">
        <h1 className="text-2xl font-bold mb-3">Portfolio</h1>
        <p className="text-muted mb-6">
          Connect your wallet to view your positions and PNL
        </p>
        <button
          onClick={login}
          className="px-6 py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  const positions = (data?.positions as Position[]) || [];
  const pnl = data?.pnl as PnlData | null;
  const openPositions = positions.filter((p) => p.status === "open");
  const closedPositions = positions.filter((p) => p.status !== "open");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-in">
      <h1 className="text-2xl font-bold mb-6">Portfolio</h1>

      {/* PNL Cards */}
      {pnl && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="text-xs text-muted mb-1">Total PNL</div>
            <PnlBadge value={pnl.total_pnl} />
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="text-xs text-muted mb-1">Realized</div>
            <PnlBadge value={pnl.total_realized} />
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="text-xs text-muted mb-1">Unrealized</div>
            <PnlBadge value={pnl.total_unrealized} />
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="text-xs text-muted mb-1">Positions</div>
            <span className="text-xl font-bold">{pnl.positions_count}</span>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-xl p-5 animate-pulse"
            >
              <div className="h-4 bg-card-hover rounded w-1/3 mb-3" />
              <div className="h-3 bg-card-hover rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-red text-sm text-center py-8">
          {error instanceof Error ? error.message : "Failed to load positions"}
        </p>
      )}

      {!isLoading && positions.length === 0 && (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <p className="text-muted mb-4">No positions yet</p>
          <Link
            href="/"
            className="text-accent hover:underline text-sm"
          >
            Browse markets to start trading
          </Link>
        </div>
      )}

      {/* Open Positions */}
      {openPositions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">
            Open Positions ({openPositions.length})
          </h2>
          <div className="space-y-3">
            {openPositions.map((pos) => {
              const pnlValue =
                (pos.current_price - pos.avg_entry_price) * pos.token_amount;
              return (
                <Link
                  key={pos.id}
                  href={`/market/${pos.platform}/${encodeURIComponent(pos.market_id)}`}
                  className="block bg-card border border-border rounded-xl p-5 hover:bg-card-hover transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">
                        {pos.market_title || pos.market_id}
                      </h3>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted">
                        <span className="capitalize">{pos.platform}</span>
                        <span
                          className={`font-semibold ${
                            pos.outcome === "yes" ? "text-green" : "text-red"
                          }`}
                        >
                          {pos.outcome.toUpperCase()}
                        </span>
                        <span>{pos.token_amount.toFixed(2)} shares</span>
                        <span>
                          Avg: {formatUsd(pos.avg_entry_price)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm font-mono">
                        {formatUsd(pos.current_price)}
                      </div>
                      <PnlBadge value={pnlValue} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Closed Positions */}
      {closedPositions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Closed Positions ({closedPositions.length})
          </h2>
          <div className="space-y-3">
            {closedPositions.map((pos) => {
              const pnlValue =
                (pos.current_price - pos.avg_entry_price) * pos.token_amount;
              return (
                <div
                  key={pos.id}
                  className="bg-card border border-border rounded-xl p-5 opacity-70"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">
                        {pos.market_title || pos.market_id}
                      </h3>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted">
                        <span className="capitalize">{pos.platform}</span>
                        <span
                          className={`font-semibold ${
                            pos.outcome === "yes" ? "text-green" : "text-red"
                          }`}
                        >
                          {pos.outcome.toUpperCase()}
                        </span>
                        <span>{pos.token_amount.toFixed(2)} shares</span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <PnlBadge value={pnlValue} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
