const BASE_URL = "https://api.spreddterminal.com/v1";

function getHeaders(): HeadersInit {
  const key = process.env.SPREDD_API_KEY;
  if (!key) throw new Error("SPREDD_API_KEY not set");
  return {
    "X-API-Key": key,
    "Content-Type": "application/json",
  };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `Spredd API error: ${res.status}`);
  }
  return res.json();
}

// ── Markets ──

export interface Market {
  market_id: string;
  platform: string;
  title: string;
  question?: string;
  category?: string;
  outcomes?: { yes: number; no: number };
  volume?: number;
  volume_24h?: number;
  liquidity?: number;
  end_date?: string;
  active?: boolean;
  contract_address?: string;
  image_url?: string;
}

export interface OrderBook {
  platform: string;
  market_id: string;
  bids: { price: number; size: number }[];
  asks: { price: number; size: number }[];
  spread: number;
}

export function listMarkets(params?: {
  platform?: string;
  search?: string;
  category?: string;
  active?: boolean;
  limit?: number;
  offset?: number;
  sort?: string;
}) {
  const sp = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) sp.set(k, String(v));
    });
  }
  return request<Market[]>(`/markets?${sp}`);
}

export function getMarket(platform: string, marketId: string) {
  return request<Market>(`/markets/${platform}/${encodeURIComponent(marketId)}`);
}

export function getOrderBook(platform: string, marketId: string, outcome = "yes") {
  return request<OrderBook>(
    `/markets/${platform}/${encodeURIComponent(marketId)}/orderbook?outcome=${outcome}`
  );
}

export function getPriceHistory(platform: string, marketId: string, interval = "1d") {
  return request<{ prices: { timestamp: string; price: number }[] }>(
    `/markets/${platform}/${encodeURIComponent(marketId)}/price-history?interval=${interval}`
  );
}

// ── Trading ──

export interface Quote {
  platform: string;
  market_id: string;
  outcome: string;
  side: string;
  input_amount: number;
  expected_output: number;
  price_per_token: number;
  price_impact: number;
  fee_amount: number;
  fee_bps: number;
  expires_at: string;
  quote_data?: unknown;
}

export interface PreparedTx {
  transactions: {
    to: string;
    data: string;
    value: string;
    gas: string;
    chain_id: number;
    description: string;
  }[];
  quote: Quote;
}

export function getQuote(body: {
  platform: string;
  market_id: string;
  outcome: string;
  side: string;
  amount: number;
}) {
  return request<Quote>("/trading/quote", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function prepareTrade(body: {
  platform: string;
  market_id: string;
  outcome: string;
  side: string;
  amount: number;
  wallet_address: string;
}) {
  return request<PreparedTx>("/trading/prepare", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ── Custom Markets ──

export interface CreateMarketResponse {
  contract_address: string;
  tx_hashes: string[];
  explorer_urls: string[];
  market_id?: string;
  question?: string;
  chain?: string;
}

export function createMarket(body: {
  chain: string;
  question: string;
  option_a?: string;
  option_b?: string;
  end_time: string;
  token?: string;
  liquidity: number;
  wallet_address: string;
  private_key: string;
}) {
  return request<CreateMarketResponse>("/markets/create", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function resolveMarket(contractAddress: string, body: {
  winning_outcome: string;
  private_key: string;
}) {
  return request<{ tx_hash: string; status: string }>(
    `/markets/${encodeURIComponent(contractAddress)}/resolve`,
    { method: "POST", body: JSON.stringify(body) }
  );
}

export function claimWinnings(contractAddress: string, body: {
  wallet_address: string;
  private_key: string;
}) {
  return request<{ tx_hash: string; payout_amount: number }>(
    `/markets/${encodeURIComponent(contractAddress)}/claim`,
    { method: "POST", body: JSON.stringify(body) }
  );
}

// ── Positions ──

export interface Position {
  id: string;
  wallet_address: string;
  platform: string;
  market_id: string;
  outcome: string;
  token_amount: number;
  avg_entry_price: number;
  current_price: number;
  status: string;
  created_at: string;
  updated_at: string;
  market_title?: string;
}

export interface PnlSummary {
  wallet_address: string;
  platform?: string;
  interval: string;
  total_realized: number;
  total_unrealized: number;
  total_pnl: number;
  positions_count: number;
}

export function listPositions(params: {
  wallet_address: string;
  platform?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) sp.set(k, String(v));
  });
  return request<Position[]>(`/positions?${sp}`);
}

export function getPnl(params: {
  wallet_address: string;
  platform?: string;
  interval?: string;
}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) sp.set(k, String(v));
  });
  return request<PnlSummary>(`/trading/positions/pnl?${sp}`);
}

// ── News ──

export interface NewsArticle {
  title: string;
  source: string;
  published_at: string;
  url: string;
  relevance_score: number;
}

export function getNews(limit = 5) {
  return request<NewsArticle[]>(`/news?limit=${limit}`);
}

export function getMarketNews(platform: string, marketId: string) {
  return request<NewsArticle[]>(`/news/market/${platform}/${encodeURIComponent(marketId)}`);
}
