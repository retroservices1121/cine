"use client";

import { useState, useCallback } from "react";
import { useAuth, useSendTx } from "@/hooks/useAuth";
import { getQuote, prepareTrade } from "@/hooks/useSpredd";

interface TradePanelProps {
  platform: string;
  marketId: string;
  outcomes?: { yes: number; no: number };
}

export default function TradePanel({
  platform,
  marketId,
  outcomes,
}: TradePanelProps) {
  const { authenticated, user, login } = useAuth();
  const { sendTransaction } = useSendTx();

  const [outcome, setOutcome] = useState<"yes" | "no">("yes");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<{
    expected_output: number;
    price_per_token: number;
    price_impact: number;
    fee_amount: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const yesPct = Math.round((outcomes?.yes ?? 0.5) * 100);
  const noPct = Math.round((outcomes?.no ?? 0.5) * 100);

  const fetchQuote = useCallback(async () => {
    if (!amount || Number(amount) <= 0) return;
    setLoading(true);
    setError(null);
    try {
      const q = await getQuote({
        platform,
        market_id: marketId,
        outcome,
        side,
        amount: Number(amount),
      });
      setQuote(q);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Quote failed");
      setQuote(null);
    } finally {
      setLoading(false);
    }
  }, [platform, marketId, outcome, side, amount]);

  const executeTrade = async () => {
    if (!authenticated || !user?.wallet?.address) {
      login();
      return;
    }
    setLoading(true);
    setError(null);
    setTxStatus("Preparing transaction...");

    try {
      const prepared = await prepareTrade({
        platform,
        market_id: marketId,
        outcome,
        side,
        amount: Number(amount),
        wallet_address: user.wallet.address,
      });

      for (let i = 0; i < prepared.transactions.length; i++) {
        const tx = prepared.transactions[i];
        setTxStatus(
          `Signing tx ${i + 1}/${prepared.transactions.length}: ${tx.description}`
        );
        await sendTransaction(
          {
            to: tx.to as `0x${string}`,
            data: tx.data as `0x${string}`,
            value: BigInt(tx.value || "0"),
            chainId: tx.chain_id,
          },
          { address: user.wallet.address }
        );
      }

      setTxStatus("Trade executed successfully!");
      setQuote(null);
      setAmount("");
      setTimeout(() => setTxStatus(null), 4000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Trade failed");
      setTxStatus(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="font-semibold mb-4">Trade</h3>

      {/* Buy / Sell toggle */}
      <div className="flex rounded-lg bg-background overflow-hidden mb-4">
        {(["buy", "sell"] as const).map((s) => (
          <button
            key={s}
            onClick={() => { setSide(s); setQuote(null); }}
            className={`flex-1 py-2 text-sm font-medium transition-colors capitalize ${
              side === s
                ? s === "buy"
                  ? "bg-green text-white"
                  : "bg-red text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Outcome selection */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => { setOutcome("yes"); setQuote(null); }}
          className={`py-3 rounded-lg text-sm font-semibold transition-all border ${
            outcome === "yes"
              ? "bg-green/10 border-green text-green"
              : "bg-background border-border text-muted hover:border-green/50"
          }`}
        >
          Yes {yesPct}¢
        </button>
        <button
          onClick={() => { setOutcome("no"); setQuote(null); }}
          className={`py-3 rounded-lg text-sm font-semibold transition-all border ${
            outcome === "no"
              ? "bg-red/10 border-red text-red"
              : "bg-background border-border text-muted hover:border-red/50"
          }`}
        >
          No {noPct}¢
        </button>
      </div>

      {/* Amount input */}
      <div className="mb-4">
        <label className="text-xs text-muted mb-1.5 block">Amount (USDC)</label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setQuote(null); }}
            placeholder="0.00"
            min="0"
            step="0.01"
            className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:border-accent transition-colors"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
            USDC
          </span>
        </div>
        {/* Quick amounts */}
        <div className="flex gap-2 mt-2">
          {[5, 10, 25, 50, 100].map((v) => (
            <button
              key={v}
              onClick={() => { setAmount(String(v)); setQuote(null); }}
              className="flex-1 py-1 text-xs text-muted bg-background border border-border rounded hover:border-accent/50 transition-colors"
            >
              ${v}
            </button>
          ))}
        </div>
      </div>

      {/* Quote button */}
      {!quote && (
        <button
          onClick={fetchQuote}
          disabled={loading || !amount || Number(amount) <= 0}
          className="w-full py-3 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors mb-3"
        >
          {loading ? "Getting quote..." : "Get Quote"}
        </button>
      )}

      {/* Quote details */}
      {quote && (
        <div className="mb-4 p-3 bg-background rounded-lg border border-border space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Expected shares</span>
            <span className="font-mono">{quote.expected_output.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Price per share</span>
            <span className="font-mono">{quote.price_per_token.toFixed(4)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Price impact</span>
            <span
              className={`font-mono ${quote.price_impact > 0.05 ? "text-red" : "text-muted"}`}
            >
              {(quote.price_impact * 100).toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Fee</span>
            <span className="font-mono">${quote.fee_amount.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Execute button */}
      {quote && (
        <button
          onClick={executeTrade}
          disabled={loading}
          className={`w-full py-3 text-white text-sm font-medium rounded-lg transition-colors ${
            side === "buy"
              ? "bg-green hover:bg-green/90"
              : "bg-red hover:bg-red/90"
          } disabled:opacity-50`}
        >
          {loading
            ? txStatus || "Processing..."
            : `${side === "buy" ? "Buy" : "Sell"} ${outcome.toUpperCase()}`}
        </button>
      )}

      {/* Status / Error */}
      {txStatus && !loading && (
        <p className="mt-3 text-sm text-green text-center">{txStatus}</p>
      )}
      {error && <p className="mt-3 text-sm text-red text-center">{error}</p>}
    </div>
  );
}
