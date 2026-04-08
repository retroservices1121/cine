"use client";

import { useQuery } from "@tanstack/react-query";

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || "API error");
  }
  return res.json();
}

async function apiPost<T>(url: string, data: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || "API error");
  }
  return res.json();
}

export function useMarkets(params?: {
  search?: string;
  platform?: string;
  category?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}) {
  const sp = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") sp.set(k, String(v));
    });
  }
  return useQuery({
    queryKey: ["markets", params],
    queryFn: () => apiFetch<unknown[]>(`/api/markets?${sp}`),
    staleTime: 30_000,
  });
}

export function useMarketDetail(platform: string, marketId: string) {
  return useQuery({
    queryKey: ["market", platform, marketId],
    queryFn: () =>
      apiFetch<{ market: unknown; orderbook: unknown; priceHistory: unknown }>(
        `/api/markets/${platform}/${encodeURIComponent(marketId)}?include=orderbook,history`
      ),
    enabled: !!platform && !!marketId,
    staleTime: 15_000,
  });
}

export function usePositions(walletAddress: string | undefined) {
  return useQuery({
    queryKey: ["positions", walletAddress],
    queryFn: () =>
      apiFetch<{ positions: unknown[]; pnl: unknown }>(
        `/api/positions?wallet_address=${walletAddress}&include=pnl`
      ),
    enabled: !!walletAddress,
    staleTime: 30_000,
  });
}

export async function getQuote(data: {
  platform: string;
  market_id: string;
  outcome: string;
  side: string;
  amount: number;
}) {
  return apiPost<{
    input_amount: number;
    expected_output: number;
    price_per_token: number;
    price_impact: number;
    fee_amount: number;
    expires_at: string;
  }>("/api/trade/quote", data);
}

export async function prepareTrade(data: {
  platform: string;
  market_id: string;
  outcome: string;
  side: string;
  amount: number;
  wallet_address: string;
}) {
  return apiPost<{
    transactions: {
      to: string;
      data: string;
      value: string;
      gas: string;
      chain_id: number;
      description: string;
    }[];
    quote: unknown;
  }>("/api/trade/prepare", data);
}

export async function createMarketApi(data: {
  chain: string;
  question: string;
  option_a?: string;
  option_b?: string;
  end_time: string;
  liquidity: number;
  wallet_address: string;
  private_key: string;
}) {
  return apiPost<{
    contract_address: string;
    tx_hashes: string[];
    explorer_urls: string[];
  }>("/api/markets/create", data);
}
