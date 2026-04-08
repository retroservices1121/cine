"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { formatUsd } from "@/lib/utils";

interface TradePanelProps {
  platform: string;
  marketId: string;
  outcomes?: { yes: number; no: number };
}

type OrderType = "market" | "limit" | "stoploss";

async function apiPost<T>(url: string, data: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || json.detail || "Request failed");
  return json;
}

export default function TradePanel({ platform, marketId, outcomes }: TradePanelProps) {
  const { authenticated, user, login } = useAuth();

  const [outcome, setOutcome] = useState<"yes" | "no">("yes");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [amount, setAmount] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [quote, setQuote] = useState<{ expected_output: number; price_per_token: number; price_impact: number; fee_amount: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ tx_hash: string; output_amount: number; explorer_url?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const yesPrice = outcomes?.yes ?? 0.5;
  const noPrice = outcomes?.no ?? 0.5;

  const resetState = () => { setQuote(null); setResult(null); setError(null); };

  const fetchQuote = useCallback(async () => {
    if (!amount || Number(amount) <= 0) return;
    setLoading(true); setError(null);
    try {
      const q = await apiPost<typeof quote>("/api/trade/quote", { platform, market_id: marketId, outcome, side: "buy", amount: Number(amount) });
      setQuote(q);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Quote failed"); }
    finally { setLoading(false); }
  }, [platform, marketId, outcome, amount]);

  const executeTrade = async () => {
    if (!authenticated) { login(); return; }
    if (!privateKey) { setError("Private key required"); return; }
    setLoading(true); setError(null);
    try {
      if (orderType === "market") {
        const res = await apiPost<{ tx_hash: string; output_amount: number; explorer_url?: string }>("/api/trade/execute", {
          platform, market_id: marketId, outcome, side: "buy", amount: Number(amount), wallet_address: user?.wallet?.address, private_key: privateKey,
        });
        setResult(res);
      } else {
        await apiPost("/api/trade/orders", {
          platform, market_id: marketId, outcome, side: "buy", order_type: orderType, amount: Number(amount),
          price: Number(limitPrice) / 100, wallet_address: user?.wallet?.address, private_key: privateKey,
        });
        setResult({ tx_hash: "", output_amount: 0 });
      }
      setPrivateKey(""); setQuote(null);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Trade failed"); }
    finally { setLoading(false); }
  };

  if (result) {
    return (
      <div className="glass-panel rounded-xl p-8 top-light">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full noir-gradient flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-2xl">check</span>
          </div>
          <h3 className="font-headline font-bold text-white text-lg mb-2">
            {orderType === "market" ? "Prediction Confirmed!" : "Order Placed!"}
          </h3>
          {result.tx_hash && <p className="text-white/40 text-[10px] font-mono break-all mb-3">{result.tx_hash}</p>}
          {result.output_amount > 0 && <p className="text-white/60 text-sm mb-4">{result.output_amount.toFixed(2)} shares acquired</p>}
          {result.explorer_url && <a href={result.explorer_url} target="_blank" rel="noopener noreferrer" className="text-primary text-xs hover:underline block mb-4">View on explorer</a>}
          <button onClick={() => { setResult(null); setAmount(""); resetState(); }} className="w-full py-3 bg-surface-container-highest text-white rounded-xl text-sm font-headline hover:bg-surface-bright transition-all">
            New Prediction
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-xl p-6 lg:p-8 top-light">
      <h3 className="font-headline font-bold text-xl text-white mb-6 uppercase tracking-tight">Place Prediction</h3>

      {/* Order type tabs */}
      <div className="flex bg-surface-container-highest rounded-full p-1 mb-6">
        {(["market", "limit", "stoploss"] as const).map((t) => (
          <button key={t} onClick={() => { setOrderType(t); resetState(); }}
            className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-full transition-all ${orderType === t ? "bg-primary text-on-primary" : "text-white/40 hover:text-white"}`}>
            {t === "stoploss" ? "Stop" : t}
          </button>
        ))}
      </div>

      {/* Yes / No pills */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button onClick={() => { setOutcome("yes"); resetState(); }}
          className={`py-4 rounded-full font-headline font-bold text-lg transition-all ${
            outcome === "yes" ? "bg-surface-container-high text-white" : "bg-surface-container-high text-white/30"
          }`} style={outcome === "yes" ? { border: "2px solid #2793fb" } : { border: "2px solid transparent" }}>
          YES <span className="block text-xs font-normal opacity-50">Buy at {(yesPrice * 100).toFixed(1)}¢</span>
        </button>
        <button onClick={() => { setOutcome("no"); resetState(); }}
          className={`py-4 rounded-full font-headline font-bold text-lg transition-all ${
            outcome === "no" ? "bg-surface-container-high text-white" : "bg-surface-container-high text-white/30"
          }`} style={outcome === "no" ? { border: "2px solid #ff5625" } : { border: "2px solid transparent" }}>
          NO <span className="block text-xs font-normal opacity-50">Buy at {(noPrice * 100).toFixed(1)}¢</span>
        </button>
      </div>

      {/* Amount input */}
      <div className="mb-6">
        <div className="flex justify-between text-[10px] uppercase tracking-[0.15em] text-on-surface-variant mb-2">
          <span>Amount (USDC)</span>
        </div>
        <input
          type="number" value={amount} onChange={(e) => { setAmount(e.target.value); resetState(); }}
          placeholder="0.00"
          className="w-full bg-surface-container-highest border-none rounded-xl py-4 px-6 text-white font-headline text-2xl focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <div className="flex gap-2 mt-2">
          {[10, 25, 50, 100, 250].map((v) => (
            <button key={v} onClick={() => { setAmount(String(v)); resetState(); }}
              className="flex-1 py-1.5 text-[10px] text-white/40 bg-surface-container-high rounded-lg font-bold hover:bg-surface-bright hover:text-white transition-all">
              ${v}
            </button>
          ))}
        </div>
      </div>

      {/* Limit price */}
      {orderType !== "market" && (
        <div className="mb-6">
          <label className="text-[10px] uppercase tracking-[0.15em] text-on-surface-variant mb-2 block">
            {orderType === "limit" ? "Limit Price" : "Trigger Price"} (cents)
          </label>
          <input type="number" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} placeholder="0-100"
            className="w-full bg-surface-container-highest border-none rounded-xl py-3 px-6 text-white font-headline text-lg focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
      )}

      {/* Quote */}
      {orderType === "market" && !quote && (
        <button onClick={fetchQuote} disabled={loading || !amount || Number(amount) <= 0}
          className="w-full py-3 mb-4 bg-surface-container-highest text-white rounded-xl text-sm font-headline font-bold uppercase tracking-wider hover:bg-surface-bright disabled:opacity-30 transition-all">
          {loading ? "Calculating..." : "Get Quote"}
        </button>
      )}

      {quote && (
        <div className="space-y-3 mb-6 text-sm">
          <div className="flex justify-between text-white/50">
            <span>Expected Payout</span>
            <span className="text-white">{formatUsd(quote.expected_output)}</span>
          </div>
          <div className="flex justify-between text-white/50">
            <span>Price Impact</span>
            <span className={quote.price_impact > 0.05 ? "text-secondary" : "text-white"}>{(quote.price_impact * 100).toFixed(2)}%</span>
          </div>
          <div className="flex justify-between text-white/50">
            <span>Fee</span>
            <span className="text-white">{formatUsd(quote.fee_amount)}</span>
          </div>
        </div>
      )}

      {/* Private key + confirm */}
      {(quote || orderType !== "market") && (
        <>
          <div className="mb-6">
            <input type="password" value={privateKey} onChange={(e) => setPrivateKey(e.target.value)} placeholder="Private key (0x...)"
              className="w-full bg-surface-container-highest border-none rounded-xl py-3 px-6 text-xs font-mono text-white/80 focus:outline-none focus:ring-1 focus:ring-primary" />
            <p className="text-white/20 text-[9px] mt-1.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px] text-secondary/60">lock</span>
              Sent directly to exchange. Never stored.
            </p>
          </div>
          <button onClick={executeTrade} disabled={loading || !privateKey}
            className="w-full noir-gradient text-on-primary font-headline font-bold py-5 rounded-xl text-lg shadow-[0_8px_24px_rgba(39,147,251,0.3)] active:scale-95 disabled:opacity-30 transition-all uppercase tracking-wider">
            {loading ? "Processing..." : "Confirm Prediction"}
          </button>
        </>
      )}

      {error && (
        <div className="mt-4 p-3 bg-error/5 rounded-xl">
          <p className="text-error text-xs">{error}</p>
        </div>
      )}
    </div>
  );
}
