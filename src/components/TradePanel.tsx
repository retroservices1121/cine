"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { cn, formatUsd } from "@/lib/utils";

interface TradePanelProps {
  platform: string;
  marketId: string;
  outcomes?: { yes: number; no: number };
}

type OrderType = "market" | "limit" | "stoploss";

async function apiPost<T>(url: string, data: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || json.detail || "Request failed");
  return json;
}

export default function TradePanel({ platform, marketId, outcomes }: TradePanelProps) {
  const { authenticated, user, login } = useAuth();

  const [outcome, setOutcome] = useState<"yes" | "no">("yes");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [amount, setAmount] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [quote, setQuote] = useState<{
    expected_output: number;
    price_per_token: number;
    price_impact: number;
    fee_amount: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    tx_hash: string;
    output_amount: number;
    explorer_url?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const yesPct = Math.round((outcomes?.yes ?? 0.5) * 100);
  const noPct = Math.round((outcomes?.no ?? 0.5) * 100);

  const resetState = () => {
    setQuote(null);
    setResult(null);
    setError(null);
  };

  const fetchQuote = useCallback(async () => {
    if (!amount || Number(amount) <= 0) return;
    setLoading(true);
    setError(null);
    try {
      const q = await apiPost<{
        expected_output: number;
        price_per_token: number;
        price_impact: number;
        fee_amount: number;
      }>("/api/trade/quote", {
        platform,
        market_id: marketId,
        outcome,
        side,
        amount: Number(amount),
      });
      setQuote(q);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Quote failed");
    } finally {
      setLoading(false);
    }
  }, [platform, marketId, outcome, side, amount]);

  const executeTrade = async () => {
    if (!authenticated) { login(); return; }
    if (!privateKey) { setError("Private key required to sign the transaction"); return; }

    setLoading(true);
    setError(null);

    try {
      if (orderType === "market") {
        const res = await apiPost<{
          tx_hash: string;
          output_amount: number;
          explorer_url?: string;
        }>("/api/trade/execute", {
          platform,
          market_id: marketId,
          outcome,
          side,
          amount: Number(amount),
          wallet_address: user?.wallet?.address,
          private_key: privateKey,
        });
        setResult(res);
      } else {
        await apiPost("/api/trade/orders", {
          platform,
          market_id: marketId,
          outcome,
          side,
          order_type: orderType,
          amount: Number(amount),
          price: Number(limitPrice) / 100, // Convert cents to decimal
          wallet_address: user?.wallet?.address,
          private_key: privateKey,
        });
        setResult({ tx_hash: "", output_amount: 0 });
      }
      setPrivateKey("");
      setQuote(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Trade failed");
    } finally {
      setLoading(false);
    }
  };

  // Success view
  if (result) {
    return (
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-dim flex items-center justify-center">
            <svg className="w-6 h-6 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="font-semibold mb-1">
            {orderType === "market" ? "Trade Executed!" : "Order Placed!"}
          </h3>
          {result.tx_hash && (
            <p className="text-xs text-text-muted font-mono mb-3 break-all">
              {result.tx_hash}
            </p>
          )}
          {result.output_amount > 0 && (
            <p className="text-sm text-text-secondary mb-3">
              Received {result.output_amount.toFixed(2)} shares
            </p>
          )}
          {result.explorer_url && (
            <a
              href={result.explorer_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline text-xs block mb-3"
            >
              View on explorer
            </a>
          )}
          <button
            onClick={() => { setResult(null); setAmount(""); resetState(); }}
            className="w-full py-2 bg-card-hover border border-border rounded-lg text-sm hover:bg-bg transition-colors"
          >
            New Trade
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="text-sm font-semibold mb-3">Trade</h3>

      {/* Order type tabs */}
      <div className="flex rounded-md bg-bg p-0.5 mb-3">
        {(["market", "limit", "stoploss"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setOrderType(t); resetState(); }}
            className={cn(
              "flex-1 py-1.5 text-[11px] font-medium rounded transition-colors capitalize",
              orderType === t ? "bg-card text-text" : "text-text-muted hover:text-text"
            )}
          >
            {t === "stoploss" ? "Stop-Loss" : t}
          </button>
        ))}
      </div>

      {/* Buy/Sell toggle */}
      <div className="flex rounded-md overflow-hidden mb-3">
        {(["buy", "sell"] as const).map((s) => (
          <button
            key={s}
            onClick={() => { setSide(s); resetState(); }}
            className={cn(
              "flex-1 py-2 text-xs font-semibold transition-colors uppercase",
              side === s
                ? s === "buy" ? "bg-green text-white" : "bg-red text-white"
                : "bg-bg text-text-muted hover:text-text"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Outcome buttons */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={() => { setOutcome("yes"); resetState(); }}
          className={cn(
            "py-2.5 rounded-lg text-xs font-bold transition-all border",
            outcome === "yes"
              ? "bg-green-dim border-green/40 text-green"
              : "bg-bg border-border text-text-muted hover:border-green/30"
          )}
        >
          Yes {yesPct}¢
        </button>
        <button
          onClick={() => { setOutcome("no"); resetState(); }}
          className={cn(
            "py-2.5 rounded-lg text-xs font-bold transition-all border",
            outcome === "no"
              ? "bg-red-dim border-red/40 text-red"
              : "bg-bg border-border text-text-muted hover:border-red/30"
          )}
        >
          No {noPct}¢
        </button>
      </div>

      {/* Amount */}
      <div className="mb-3">
        <label className="text-[10px] text-text-muted mb-1 block">Amount (USD)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">$</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); resetState(); }}
            placeholder="0.00"
            min="0"
            step="0.01"
            className="w-full bg-bg border border-border rounded-lg pl-7 pr-3 py-2.5 text-sm font-mono focus:outline-none focus:border-accent/50 transition-colors"
          />
        </div>
        <div className="flex gap-1.5 mt-1.5">
          {[5, 10, 25, 50, 100].map((v) => (
            <button
              key={v}
              onClick={() => { setAmount(String(v)); resetState(); }}
              className="flex-1 py-1 text-[10px] text-text-muted bg-bg border border-border rounded hover:border-border-hover transition-colors"
            >
              ${v}
            </button>
          ))}
        </div>
      </div>

      {/* Limit price (for limit/stoploss) */}
      {orderType !== "market" && (
        <div className="mb-3">
          <label className="text-[10px] text-text-muted mb-1 block">
            {orderType === "limit" ? "Limit Price" : "Trigger Price"} (cents)
          </label>
          <input
            type="number"
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
            placeholder="0-100"
            min="0"
            max="100"
            className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-accent/50 transition-colors"
          />
        </div>
      )}

      {/* Quote button (market orders) */}
      {orderType === "market" && !quote && (
        <button
          onClick={fetchQuote}
          disabled={loading || !amount || Number(amount) <= 0}
          className="w-full py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-colors mb-3"
        >
          {loading ? "Getting quote..." : "Get Quote"}
        </button>
      )}

      {/* Quote details */}
      {quote && (
        <div className="mb-3 p-3 bg-bg rounded-lg border border-border space-y-1.5 text-[12px]">
          <div className="flex justify-between">
            <span className="text-text-muted">Est. shares</span>
            <span className="font-mono">{quote.expected_output.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Price/share</span>
            <span className="font-mono">{(quote.price_per_token * 100).toFixed(1)}¢</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Impact</span>
            <span className={cn("font-mono", quote.price_impact > 0.05 ? "text-red" : "text-text-muted")}>
              {(quote.price_impact * 100).toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Fee</span>
            <span className="font-mono">{formatUsd(quote.fee_amount)}</span>
          </div>
        </div>
      )}

      {/* Private key + execute */}
      {(quote || orderType !== "market") && (
        <>
          <div className="mb-3">
            <label className="text-[10px] text-text-muted mb-1 block">Private Key</label>
            <input
              type="password"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              placeholder="0x..."
              className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-accent/50 transition-colors"
            />
            <p className="text-[9px] text-text-muted mt-1 flex items-center gap-1">
              <svg className="w-3 h-3 text-amber shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Sent directly to the exchange. Never stored.
            </p>
          </div>

          <button
            onClick={executeTrade}
            disabled={loading || !privateKey}
            className={cn(
              "w-full py-2.5 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-40",
              side === "buy" ? "bg-green hover:bg-green/90" : "bg-red hover:bg-red/90"
            )}
          >
            {loading
              ? "Processing..."
              : orderType === "market"
              ? `${side === "buy" ? "Buy" : "Sell"} ${outcome.toUpperCase()}`
              : `Place ${orderType === "limit" ? "Limit" : "Stop-Loss"} Order`}
          </button>
        </>
      )}

      {error && (
        <div className="mt-3 p-2 bg-red-dim rounded-lg">
          <p className="text-[11px] text-red">{error}</p>
          <button onClick={() => setError(null)} className="text-[10px] text-text-muted hover:text-text mt-1">
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
