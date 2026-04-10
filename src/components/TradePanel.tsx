"use client";

import { useState, useCallback } from "react";
import { useAuth, useSendTx } from "@/hooks/useAuth";
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
  const { sendTransaction } = useSendTx();

  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [outcome, setOutcome] = useState<"yes" | "no">("yes");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [amount, setAmount] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [privateKey, setPrivateKey] = useState(""); // only for limit/stoploss orders
  const [quote, setQuote] = useState<{ expected_output: number; price_per_token: number; price_impact: number; fee_amount: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [result, setResult] = useState<{ tx_hash: string; output_amount: number; explorer_url?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const yesPrice = outcomes?.yes ?? 0.5;
  const noPrice = outcomes?.no ?? 0.5;

  const resetState = () => { setQuote(null); setResult(null); setError(null); setTxStatus(null); };

  const fetchQuote = useCallback(async () => {
    if (!amount || Number(amount) <= 0) return;
    setLoading(true); setError(null);
    try {
      const q = await apiPost<typeof quote>("/api/trade/quote", { platform, market_id: marketId, outcome, side, amount: Number(amount) });
      setQuote(q);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Quote failed"); }
    finally { setLoading(false); }
  }, [platform, marketId, outcome, amount]);

  const executeMarketTrade = async () => {
    if (!authenticated || !user?.wallet?.address) { login(); return; }
    setLoading(true); setError(null); setTxStatus("Preparing transactions...");

    try {
      // Get unsigned transactions from Spredd
      const prepared = await apiPost<{
        transactions: { to: string; data: string; value: string; gas: string; chain_id: number; description: string }[];
        quote: unknown;
      }>("/api/trade/prepare", {
        platform, market_id: marketId, outcome, side,
        amount: Number(amount), wallet_address: user.wallet.address,
      });

      // Sign each transaction with Privy wallet
      let lastTxHash = "";
      for (let i = 0; i < prepared.transactions.length; i++) {
        const tx = prepared.transactions[i];
        setTxStatus(`Signing ${i + 1}/${prepared.transactions.length}: ${tx.description}`);
        const txHash = await sendTransaction(
          {
            to: tx.to as `0x${string}`,
            data: tx.data as `0x${string}`,
            value: BigInt(tx.value || "0"),
            chainId: tx.chain_id,
          },
          { address: user.wallet.address }
        );
        lastTxHash = typeof txHash === "string" ? txHash : "";
      }

      setResult({ tx_hash: lastTxHash, output_amount: quote?.expected_output ?? 0 });
      setQuote(null); setAmount("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Trade failed");
    } finally {
      setLoading(false); setTxStatus(null);
    }
  };

  const executeLimitOrder = async () => {
    if (!authenticated) { login(); return; }
    if (!privateKey) { setError("Private key required for limit/stop-loss orders"); return; }
    setLoading(true); setError(null);
    try {
      await apiPost("/api/trade/orders", {
        platform, market_id: marketId, outcome, side, order_type: orderType,
        amount: Number(amount), price: Number(limitPrice) / 100,
        wallet_address: user?.wallet?.address, private_key: privateKey,
      });
      setResult({ tx_hash: "", output_amount: 0 });
      setPrivateKey("");
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Order failed"); }
    finally { setLoading(false); }
  };

  // Success view
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
          <button onClick={() => { setResult(null); setAmount(""); resetState(); }}
            className="w-full py-3 bg-surface-container-highest text-white rounded-xl text-sm font-headline hover:bg-surface-bright transition-all">
            New Prediction
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-xl p-6 lg:p-8 top-light">
      <h3 className="font-headline font-bold text-xl text-white mb-6 uppercase tracking-tight">Place Prediction</h3>

      {/* Buy / Sell toggle */}
      <div className="flex rounded-xl overflow-hidden mb-4">
        {(["buy", "sell"] as const).map((s) => (
          <button key={s} onClick={() => { setSide(s); resetState(); }}
            className={`flex-1 py-2.5 text-xs font-headline font-bold uppercase tracking-wider transition-all ${
              side === s
                ? s === "buy" ? "noir-gradient text-on-primary" : "bg-secondary-container text-on-secondary-container"
                : "bg-surface-container-highest text-white/30 hover:text-white"
            }`}>
            {s}
          </button>
        ))}
      </div>

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
          className={`py-4 rounded-full font-headline font-bold text-lg transition-all bg-surface-container-high ${
            outcome === "yes" ? "text-white" : "text-white/30"
          }`} style={{ border: outcome === "yes" ? "2px solid #2793fb" : "2px solid transparent" }}>
          YES <span className="block text-xs font-normal opacity-50">Buy at {(yesPrice * 100).toFixed(1)}¢</span>
        </button>
        <button onClick={() => { setOutcome("no"); resetState(); }}
          className={`py-4 rounded-full font-headline font-bold text-lg transition-all bg-surface-container-high ${
            outcome === "no" ? "text-white" : "text-white/30"
          }`} style={{ border: outcome === "no" ? "2px solid #ff5625" : "2px solid transparent" }}>
          NO <span className="block text-xs font-normal opacity-50">Buy at {(noPrice * 100).toFixed(1)}¢</span>
        </button>
      </div>

      {/* Amount input */}
      <div className="mb-6">
        <div className="flex justify-between text-[10px] uppercase tracking-[0.15em] text-on-surface-variant mb-2">
          <span>Amount (USDC)</span>
        </div>
        <input type="number" value={amount} onChange={(e) => { setAmount(e.target.value); resetState(); }} placeholder="0.00"
          className="w-full bg-surface-container-highest border-none rounded-xl py-4 px-6 text-white font-headline text-2xl focus:outline-none focus:ring-1 focus:ring-primary" />
        <div className="flex gap-2 mt-2">
          {[10, 25, 50, 100, 250].map((v) => (
            <button key={v} onClick={() => { setAmount(String(v)); resetState(); }}
              className="flex-1 py-1.5 text-[10px] text-white/40 bg-surface-container-high rounded-lg font-bold hover:bg-surface-bright hover:text-white transition-all">
              ${v}
            </button>
          ))}
        </div>
      </div>

      {/* Limit price (limit/stoploss only) */}
      {orderType !== "market" && (
        <div className="mb-6">
          <label className="text-[10px] uppercase tracking-[0.15em] text-on-surface-variant mb-2 block">
            {orderType === "limit" ? "Limit Price" : "Trigger Price"} (cents)
          </label>
          <input type="number" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} placeholder="0-100"
            className="w-full bg-surface-container-highest border-none rounded-xl py-3 px-6 text-white font-headline text-lg focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
      )}

      {/* Quote button (market orders) */}
      {orderType === "market" && !quote && (
        <button onClick={fetchQuote} disabled={loading || !amount || Number(amount) <= 0}
          className="w-full py-3 mb-4 bg-surface-container-highest text-white rounded-xl text-sm font-headline font-bold uppercase tracking-wider hover:bg-surface-bright disabled:opacity-30 transition-all">
          {loading ? "Calculating..." : "Get Quote"}
        </button>
      )}

      {/* Quote details */}
      {quote && (
        <div className="space-y-3 mb-6 text-sm">
          <div className="flex justify-between text-white/50">
            <span>Expected Shares</span>
            <span className="text-white">{quote.expected_output.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-white/50">
            <span>Price/Share</span>
            <span className="text-white">{(quote.price_per_token * 100).toFixed(1)}¢</span>
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

      {/* Fee notice */}
      {quote && (
        <div className="mb-4 p-3 bg-surface-container rounded-xl">
          <p className="text-white/40 text-[10px] uppercase tracking-[0.1em] mb-1">Platform Fee</p>
          <p className="text-white/60 text-xs">
            1% fee on all transactions. Deducted automatically via a separate USDC transfer you will sign.
          </p>
        </div>
      )}

      {/* Private key for limit/stoploss only */}
      {orderType !== "market" && (
        <div className="mb-6">
          <input type="password" value={privateKey} onChange={(e) => setPrivateKey(e.target.value)} placeholder="Private key (0x...)"
            className="w-full bg-surface-container-highest border-none rounded-xl py-3 px-6 text-xs font-mono text-white/80 focus:outline-none focus:ring-1 focus:ring-primary" />
          <p className="text-white/20 text-[9px] mt-1.5 flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px] text-secondary/60">lock</span>
            Required for limit/stop orders. Sent to exchange, never stored.
          </p>
        </div>
      )}

      {/* Confirm button */}
      {(quote || orderType !== "market") && (
        <button
          onClick={orderType === "market" ? executeMarketTrade : executeLimitOrder}
          disabled={loading || (orderType !== "market" && !privateKey) || !authenticated}
          className="w-full noir-gradient text-on-primary font-headline font-bold py-5 rounded-xl text-lg shadow-[0_8px_24px_rgba(39,147,251,0.3)] active:scale-95 disabled:opacity-30 transition-all uppercase tracking-wider"
        >
          {loading ? (txStatus || "Processing...") : !authenticated ? "Connect Wallet" : "Confirm Prediction"}
        </button>
      )}

      {/* Status */}
      {txStatus && loading && (
        <p className="mt-3 text-primary text-xs text-center">{txStatus}</p>
      )}

      {error && (
        <div className="mt-4 p-3 bg-error/5 rounded-xl">
          <p className="text-error text-xs">{error}</p>
        </div>
      )}
    </div>
  );
}
