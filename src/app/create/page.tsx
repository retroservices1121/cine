"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createMarketApi } from "@/hooks/useSpredd";
import Link from "next/link";

export default function CreateMarketPage() {
  const { authenticated, user, login } = useAuth();

  const [question, setQuestion] = useState("");
  const [optionA, setOptionA] = useState("Yes");
  const [optionB, setOptionB] = useState("No");
  const [endTime, setEndTime] = useState("");
  const [liquidity, setLiquidity] = useState("100");
  const [privateKey, setPrivateKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    contract_address: string;
    explorer_urls: string[];
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authenticated || !user?.wallet?.address) {
      login();
      return;
    }

    if (!question || !endTime || !liquidity || !privateKey) {
      setError("All fields are required");
      return;
    }

    if (Number(liquidity) < 100) {
      setError("Minimum liquidity is $100");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await createMarketApi({
        chain: "base",
        question,
        option_a: optionA || "Yes",
        option_b: optionB || "No",
        end_time: new Date(endTime).toISOString(),
        liquidity: Number(liquidity),
        wallet_address: user.wallet.address,
        private_key: privateKey,
      });
      setResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create market");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 fade-in">
        <div className="bg-card border border-green/30 rounded-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Market Created!</h2>
          <p className="text-muted text-sm mb-4">{question}</p>

          <div className="bg-background rounded-lg p-4 mb-6 text-left">
            <div className="text-xs text-muted mb-1">Contract Address</div>
            <a
              href={result.explorer_urls?.[0] || `https://basescan.org/address/${result.contract_address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline font-mono text-sm break-all"
            >
              {result.contract_address}
            </a>
          </div>

          <div className="flex gap-3 justify-center">
            <Link
              href={`/market/spredd/${result.contract_address}`}
              className="px-6 py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors"
            >
              View Market
            </Link>
            <button
              onClick={() => {
                setResult(null);
                setQuestion("");
                setEndTime("");
                setPrivateKey("");
              }}
              className="px-6 py-2.5 bg-card-hover text-foreground text-sm font-medium rounded-lg border border-border hover:border-accent/50 transition-colors"
            >
              Create Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-in">
      <h1 className="text-2xl font-bold mb-2">Create Market</h1>
      <p className="text-muted text-sm mb-8">
        Deploy a custom prediction market on Base chain. Markets use a parimutuel
        model — odds are determined by the ratio of bets on each side.
      </p>

      {!authenticated ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-muted mb-4">Connect your wallet to create a market</p>
          <button
            onClick={login}
            className="px-6 py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Question <span className="text-red">*</span>
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Will Bitcoin reach $200,000 by December 2026?"
              rows={3}
              maxLength={500}
              minLength={10}
              className="w-full bg-card border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors resize-none"
            />
            <div className="text-xs text-muted mt-1 text-right">
              {question.length}/500
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Option A</label>
              <input
                type="text"
                value={optionA}
                onChange={(e) => setOptionA(e.target.value)}
                placeholder="Yes"
                className="w-full bg-card border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Option B</label>
              <input
                type="text"
                value={optionB}
                onChange={(e) => setOptionB(e.target.value)}
                placeholder="No"
                className="w-full bg-card border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          {/* End time */}
          <div>
            <label className="block text-sm font-medium mb-2">
              End Date <span className="text-red">*</span>
            </label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full bg-card border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Liquidity */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Initial Liquidity (USDC) <span className="text-red">*</span>
            </label>
            <input
              type="number"
              value={liquidity}
              onChange={(e) => setLiquidity(e.target.value)}
              min={100}
              step={10}
              placeholder="100"
              className="w-full bg-card border border-border rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:border-accent transition-colors"
            />
            <p className="text-xs text-muted mt-1">
              Minimum $100. Split 50/50 between Yes and No pools.
            </p>
          </div>

          {/* Private key */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Wallet Private Key <span className="text-red">*</span>
            </label>
            <input
              type="password"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              placeholder="0x..."
              className="w-full bg-card border border-border rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:border-accent transition-colors"
            />
            <p className="text-xs text-muted mt-1">
              Used to sign the deployment transaction. Never stored — used in-memory
              only.
            </p>
          </div>

          {/* Chain info */}
          <div className="bg-background border border-border rounded-lg p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Chain</span>
                <span>Base (8453)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Model</span>
                <span>Parimutuel</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Collateral</span>
                <span>USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Initial Odds</span>
                <span>50/50</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red/5 border border-red/20 rounded-lg p-3">
              <p className="text-sm text-red">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            {loading ? "Deploying market on Base..." : "Create Market on Base"}
          </button>
        </form>
      )}
    </div>
  );
}
