"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth, useSendTx } from "@/hooks/useAuth";
import { formatUsd, cn } from "@/lib/utils";
import Link from "next/link";

interface CreatedMarket {
  market_id: string;
  platform: string;
  title?: string;
  question?: string;
  outcomes?: { yes: number; no: number };
  volume?: number;
  active?: boolean;
  end_date?: string;
  contract_address?: string;
}

function authHeaders(token: string): Record<string, string> {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

export default function DashboardPage() {
  const { authenticated, user, login } = useAuth();

  // Auth gate
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Check for saved session
  useEffect(() => {
    const saved = sessionStorage.getItem("dashboard_token");
    if (saved) setToken(saved);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/auth/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid password");
      setToken(data.token);
      sessionStorage.setItem("dashboard_token", data.token);
      setPassword("");
    } catch (e: unknown) {
      setAuthError(e instanceof Error ? e.message : "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };

  // Password screen
  if (!token) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center fade-in">
        <div className="w-full max-w-sm">
          <div className="bg-surface-container-low rounded-xl p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-amber" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-lg font-bold">Dashboard Access</h1>
              <p className="text-white/40 text-xs mt-1">Enter the admin password to continue</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoFocus
                className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              />
              {authError && (
                <p className="text-xs text-secondary">{authError}</p>
              )}
              <button
                type="submit"
                disabled={authLoading || !password}
                className="w-full py-3 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {authLoading ? "Verifying..." : "Enter"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated dashboard
  return <DashboardContent token={token} onLogout={() => { setToken(null); sessionStorage.removeItem("dashboard_token"); }} />;
}

function DashboardContent({ token, onLogout }: { token: string; onLogout: () => void }) {
  const { authenticated, user, login } = useAuth();
  const { sendTransaction } = useSendTx();

  const [question, setQuestion] = useState("");
  const [optionA, setOptionA] = useState("Yes");
  const [optionB, setOptionB] = useState("No");
  const [endTime, setEndTime] = useState("");
  const [liquidity, setLiquidity] = useState("100");
  const [imageUrl, setImageUrl] = useState("");
  const [chain, setChain] = useState("base");
  const [creating, setCreating] = useState(false);
  const [createStatus, setCreateStatus] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createResult, setCreateResult] = useState<{
    contract_address: string;
    market_id?: string;
  } | null>(null);

  const [myMarkets, setMyMarkets] = useState<CreatedMarket[]>([]);
  const [loadingMarkets, setLoadingMarkets] = useState(true);

  const [resolveAddr, setResolveAddr] = useState("");
  const [resolveOutcome, setResolveOutcome] = useState<"yes" | "no">("yes");
  const [resolving, setResolving] = useState(false);
  const [resolveStatus, setResolveStatus] = useState<string | null>(null);
  const [resolveResult, setResolveResult] = useState<string | null>(null);

  const fetchMyMarkets = useCallback(async () => {
    try {
      const res = await fetch("/api/markets?platform=spredd&limit=50");
      const data = await res.json();
      setMyMarkets(Array.isArray(data) ? data : []);
    } catch {
      setMyMarkets([]);
    } finally {
      setLoadingMarkets(false);
    }
  }, []);

  useEffect(() => { fetchMyMarkets(); }, [fetchMyMarkets]);

  // Helper: sign + broadcast an array of unsigned txs via Privy wallet
  async function signTransactions(
    txs: { to: string; data: string; value: string; gas: string; chain_id: number; description?: string }[],
    onStatus: (msg: string) => void
  ): Promise<string> {
    let lastHash = "";
    for (let i = 0; i < txs.length; i++) {
      const tx = txs[i];
      onStatus(`Signing ${i + 1}/${txs.length}: ${tx.description || "transaction"}...`);
      const result = await sendTransaction(
        {
          to: tx.to as `0x${string}`,
          data: tx.data as `0x${string}`,
          value: BigInt(tx.value || "0"),
          chainId: tx.chain_id,
        },
        { address: user?.wallet?.address }
      );
      lastHash = typeof result === "string" ? result : "";
    }
    return lastHash;
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authenticated || !user?.wallet?.address) { login(); return; }
    if (!question || !endTime || !liquidity) {
      setCreateError("All fields are required"); return;
    }
    if (Number(liquidity) < 2) {
      setCreateError("Minimum liquidity is $2"); return;
    }

    setCreating(true);
    setCreateError(null);
    setCreateStatus("Preparing market deployment...");

    try {
      // Step 1: Get unsigned creation transaction
      const prepRes = await fetch("/api/markets/create", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({
          chain, question,
          option_a: optionA || "Yes",
          option_b: optionB || "No",
          end_time: new Date(endTime).toISOString(),
          liquidity: Number(liquidity),
          image_url: imageUrl || undefined,
          wallet_address: user.wallet.address,
        }),
      });
      const prepData = await prepRes.json();
      if (!prepRes.ok) throw new Error(prepData.error || "Failed to prepare");

      // Step 2: Sign and broadcast creation tx
      setCreateStatus("Sign the deploy transaction in your wallet...");
      const creationHash = await signTransactions(prepData.transactions, setCreateStatus);

      // Step 3: Fund the market (get liquidity txs)
      setCreateStatus("Registering market and preparing liquidity...");
      const fundRes = await fetch("/api/markets/create/fund", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({
          creation_tx_hash: creationHash,
          chain,
          wallet_address: user.wallet.address,
          liquidity: Number(liquidity),
        }),
      });
      const fundData = await fundRes.json();
      if (!fundRes.ok) throw new Error(fundData.error || "Failed to fund market");

      // Step 4: Sign liquidity transactions (approve + seed YES + seed NO)
      setCreateStatus("Sign the liquidity transactions in your wallet...");
      await signTransactions(fundData.transactions, setCreateStatus);

      setCreateResult({
        contract_address: fundData.contract_address,
        market_id: fundData.market_id,
      });
      fetchMyMarkets();
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : "Failed to create market");
    } finally {
      setCreating(false);
      setCreateStatus(null);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authenticated || !user?.wallet?.address) { login(); return; }
    if (!resolveAddr) return;
    setResolving(true);
    setResolveResult(null);
    setResolveStatus("Preparing resolve transaction...");
    try {
      const res = await fetch(`/api/resolve/${encodeURIComponent(resolveAddr)}`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ winning_outcome: resolveOutcome, wallet_address: user?.wallet?.address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resolve");

      // Sign the unsigned resolve tx with Privy wallet
      setResolveStatus("Sign the resolve transaction in your wallet...");
      await signTransactions(data.transactions, setResolveStatus);

      setResolveResult("Market resolved successfully!");
      fetchMyMarkets();
    } catch (e: unknown) {
      setResolveResult(e instanceof Error ? e.message : "Failed to resolve");
    } finally {
      setResolving(false);
      setResolveStatus(null);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 fade-in">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-white/40 text-sm">Create and manage prediction markets</p>
          </div>
        </div>
        <button onClick={onLogout} className="text-xs text-white/40 hover:text-secondary transition-colors">
          Lock
        </button>
      </div>

      {!authenticated && (
        <div className="bg-amber-dim border border-amber/20 rounded-xl p-4 mb-6">
          <p className="text-sm text-amber">
            <button onClick={login} className="font-medium underline">Connect your wallet</button> to create markets
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Create market */}
        <div className="space-y-6">
          <div className="bg-surface-container-low rounded-xl p-5">
            <h2 className="text-base font-semibold mb-4">Create New Market</h2>

            {createResult ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Market Created!</h3>
                <div className="bg-surface-container rounded-xl p-3 mb-4 text-left">
                  <div className="text-[10px] text-white/40">Contract</div>
                  <a
                    href={`https://basescan.org/address/${createResult.contract_address}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline font-mono break-all"
                  >{createResult.contract_address}</a>
                </div>
                <div className="flex gap-2 justify-center">
                  <Link href={`/market/spredd/${createResult.contract_address}`}
                    className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-lg transition-colors">
                    View Market
                  </Link>
                  <button onClick={() => { setCreateResult(null); setQuestion(""); setEndTime(""); setImageUrl(""); }}
                    className="px-4 py-2 bg-surface-container-highest text-xs rounded-lg hover:bg-surface-bright transition-colors">
                    Create Another
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-[0.15em] mb-1.5 block">Question *</label>
                  <textarea value={question} onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Will Bitcoin reach $200,000 by December 2026?" rows={3} maxLength={500}
                    className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
                  <div className="text-[10px] text-white/30 text-right mt-1">{question.length}/500</div>
                </div>

                {/* Market Image */}
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-[0.15em] mb-1.5 block">Market Image</label>
                  <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-primary" />
                  <p className="text-[10px] text-white/30 mt-1">Paste an image URL. Displayed on the market card and hero.</p>
                  {imageUrl && (
                    <div className="mt-3 relative rounded-xl overflow-hidden h-36 bg-surface-container-high">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                      <button type="button" onClick={() => setImageUrl("")}
                        className="absolute top-2 right-2 w-6 h-6 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/80 transition-colors">
                        <span className="material-symbols-outlined text-white text-[14px]">close</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-white/40 uppercase tracking-[0.15em] mb-1.5 block">Option A</label>
                    <input type="text" value={optionA} onChange={(e) => setOptionA(e.target.value)} placeholder="Yes"
                      className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/40 uppercase tracking-[0.15em] mb-1.5 block">Option B</label>
                    <input type="text" value={optionB} onChange={(e) => setOptionB(e.target.value)} placeholder="No"
                      className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-white/40 uppercase tracking-[0.15em] mb-1.5 block">End Date *</label>
                    <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/40 uppercase tracking-[0.15em] mb-1.5 block">Chain</label>
                    <select value={chain} onChange={(e) => setChain(e.target.value)}
                      className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer">
                      <option value="base">Base (8453)</option>
                      <option value="polygon">Polygon (137)</option>
                      <option value="arbitrum">Arbitrum (42161)</option>
                      <option value="bsc">BSC (56)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-[0.15em] mb-1.5 block">Initial Liquidity (USDC) *</label>
                  <input type="number" value={liquidity} onChange={(e) => setLiquidity(e.target.value)} min={100} step={10}
                    className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm font-mono text-white focus:outline-none focus:ring-1 focus:ring-primary" />
                  <p className="text-[10px] text-white/30 mt-1">Min $100. Split 50/50 between pools.</p>
                </div>
                {createError && (
                  <div className="p-3 bg-error/5 rounded-xl"><p className="text-xs text-error">{createError}</p></div>
                )}
                <button type="submit" disabled={creating}
                  className="w-full py-4 noir-gradient text-on-primary font-headline font-bold text-sm rounded-xl disabled:opacity-30 active:scale-95 transition-all uppercase tracking-wider shadow-[0_8px_24px_rgba(39,147,251,0.3)]">
                  {creating ? (createStatus || "Processing...") : "Create Market"}
                </button>
              </form>
            )}
          </div>

          {/* Resolve market */}
          <div className="bg-surface-container-low rounded-xl p-5">
            <h2 className="text-base font-semibold mb-4">Resolve Market</h2>
            <form onSubmit={handleResolve} className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1.5 block">Contract Address</label>
                <input type="text" value={resolveAddr} onChange={(e) => setResolveAddr(e.target.value)} placeholder="0x..."
                  className="w-full bg-surface-container-highest border-none rounded-xl px-3 py-2.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary transition-colors" />
              </div>
              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-[0.15em] mb-1.5 block">Winning Outcome</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setResolveOutcome("yes")}
                    className={cn("py-2.5 rounded-xl text-xs font-bold transition-all",
                      resolveOutcome === "yes" ? "noir-gradient text-on-primary" : "bg-surface-container-highest text-white/30"
                    )}>Yes</button>
                  <button type="button" onClick={() => setResolveOutcome("no")}
                    className={cn("py-2.5 rounded-xl text-xs font-bold transition-all",
                      resolveOutcome === "no" ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container-highest text-white/30"
                    )}>No</button>
                </div>
              </div>
              {resolveResult && (
                <p className={cn("text-xs", resolveResult.startsWith("Market") ? "text-primary-container" : "text-secondary")}>
                  {resolveResult}
                </p>
              )}
              <button type="submit" disabled={resolving || !resolveAddr}
                className="w-full py-3 noir-gradient text-on-primary font-headline font-bold text-sm rounded-xl disabled:opacity-30 active:scale-95 transition-all uppercase tracking-wider">
                {resolving ? (resolveStatus || "Processing...") : "Resolve Market"}
              </button>
            </form>
          </div>
        </div>

        {/* Right: My markets list */}
        <div>
          <div className="bg-surface-container-low rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Your Markets</h2>
              <span className="text-xs text-white/40">{myMarkets.length} markets</span>
            </div>
            {loadingMarkets ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 skeleton rounded-lg" />
                ))}
              </div>
            ) : myMarkets.length === 0 ? (
              <p className="text-white/40 text-sm text-center py-8">No markets created yet</p>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {myMarkets.map((m) => (
                  <Link key={m.market_id}
                    href={`/market/${m.platform}/${encodeURIComponent(m.market_id)}`}
                    className="block p-3 bg-surface-container rounded-xl  hover:bg-surface-container-high transition-colors">
                    <p className="text-xs font-medium line-clamp-2 mb-2">{m.title || m.question}</p>
                    <div className="flex items-center justify-between text-[10px] text-white/40">
                      <div className="flex items-center gap-2">
                        <span className={cn("px-1.5 py-0.5 rounded",
                          m.active !== false ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                        )}>{m.active !== false ? "Active" : "Resolved"}</span>
                        {m.volume != null && <span>{formatUsd(m.volume)} vol</span>}
                      </div>
                      {m.outcomes && (
                        <span className="font-mono font-bold text-text-secondary">{Math.round(m.outcomes.yes * 100)}%</span>
                      )}
                    </div>
                    {m.contract_address && (
                      <button type="button"
                        onClick={(e) => { e.preventDefault(); setResolveAddr(m.contract_address!); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        className="mt-2 text-[10px] text-amber hover:text-amber/80 transition-colors">
                        Resolve this market
                      </button>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
