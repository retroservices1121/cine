const BASE_URL = "https://api.spreddterminal.com/v1";

function getHeaders(): HeadersInit {
  const key = process.env.SPREDD_API_KEY;
  if (!key) throw new Error("SPREDD_API_KEY not set");
  return { "X-API-Key": key, "Content-Type": "application/json" };
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

// ── Types ──

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
  description?: string;
  status?: string;
}

export interface OrderBook {
  platform: string;
  market_id: string;
  bids: { price: number; size: number }[];
  asks: { price: number; size: number }[];
  spread: number;
}

export interface PricePoint {
  timestamp: string;
  price: number;
}

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
}

export interface TradeResult {
  tx_hash: string;
  status: string;
  platform: string;
  market_id: string;
  input_amount: number;
  output_amount: number;
  fee_amount: number;
  explorer_url: string;
}

export interface Order {
  order_id: string;
  platform: string;
  market_id: string;
  market_title?: string;
  outcome: string;
  side: string;
  order_type: string;
  amount: number;
  filled_amount: number;
  price: number;
  executed_price?: number;
  shares?: number;
  fee_amount: number;
  status: string;
  tx_hash?: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

export interface Position {
  id: string;
  wallet_address: string;
  platform: string;
  market_id: string;
  market_title?: string;
  outcome: string;
  token_amount: number;
  avg_entry_price: number;
  current_price: number;
  status: string;
  created_at: string;
  updated_at: string;
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

export interface ArbitrageOpp {
  market_title: string;
  outcome: string;
  buy_platform: string;
  buy_price: number;
  sell_platform: string;
  sell_price: number;
  spread: number;
  spread_pct: number;
}

export interface NewsArticle {
  title: string;
  source: string;
  published_at: string;
  url: string;
  relevance_score: number;
  matched_markets?: { platform: string; market_id: string; title: string }[];
}

export interface UsageStats {
  account_id: string;
  api_key_prefix: string;
  tier: string;
  tier_price_usd: number;
  rate_limit_rpm: number;
  monthly_request_quota: number;
  monthly_requests_used: number;
  total_requests: number;
  total_trades: number;
  total_volume: number;
  total_fees: number;
}

export interface CreateMarketResponse {
  contract_address: string;
  tx_hashes: string[];
  explorer_urls: string[];
}

// ── Markets ──

export function listMarkets(params?: Record<string, string | number | boolean | undefined>) {
  const sp = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") sp.set(k, String(v));
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

export function getPriceHistory(platform: string, marketId: string, interval = "1h") {
  return request<{ prices: PricePoint[] }>(
    `/markets/${platform}/${encodeURIComponent(marketId)}/price-history?interval=${interval}`
  );
}

export function getSparklines(marketIds: { platform: string; market_id: string }[]) {
  return request<Record<string, number[]>>("/markets/sparklines", {
    method: "POST",
    body: JSON.stringify({ markets: marketIds }),
  });
}

// ── Trading ──

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

export function executeTrade(body: {
  platform: string;
  market_id: string;
  outcome: string;
  side: string;
  amount: number;
  wallet_address?: string;
  private_key: string;
}) {
  return request<TradeResult>("/trading/execute", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function createOrder(body: {
  platform: string;
  market_id: string;
  outcome: string;
  side: string;
  order_type: string;
  amount: number;
  price?: number;
  wallet_address?: string;
  private_key: string;
}) {
  return request<Order>("/trading/order", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function listOrders(params?: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) sp.set(k, String(v));
    });
  }
  return request<Order[]>(`/trading/orders?${sp}`);
}

export function cancelOrder(orderId: string) {
  return request<{ cancelled: boolean }>(`/trading/orders/${orderId}`, {
    method: "DELETE",
  });
}

export function redeemPosition(body: {
  platform: string;
  market_id: string;
  outcome: string;
  wallet_address: string;
  private_key: string;
}) {
  return request<{
    redemption_id: string;
    shares_redeemed: number;
    payout_amount: number;
    tx_hash: string;
    status: string;
  }>("/trading/redeem", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ── Positions ──

export function listPositions(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) sp.set(k, String(v));
  });
  return request<Position[]>(`/positions?${sp}`);
}

export function getPnl(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) sp.set(k, String(v));
  });
  return request<PnlSummary>(`/trading/positions/pnl?${sp}`);
}

// ── Arbitrage ──

export function getArbitrage(minSpread?: number) {
  const sp = new URLSearchParams();
  if (minSpread) sp.set("min_spread", String(minSpread));
  return request<ArbitrageOpp[]>(`/arbitrage?${sp}`);
}

// ── News ──

export function getNews(limit = 20) {
  return request<NewsArticle[]>(`/news?limit=${limit}`);
}

export function getMarketNews(platform: string, marketId: string) {
  return request<NewsArticle[]>(`/news/market/${platform}/${encodeURIComponent(marketId)}`);
}

// ── Usage ──

export function getUsage() {
  return request<UsageStats>("/usage");
}

// ── Custom Markets (v1.3.0 — Client-Side Signing) ──

export interface UnsignedTx {
  to: string;
  data: string;
  value: string;
  gas: string;
  chain_id: number;
  description?: string;
}

export interface PrepareCreateResponse {
  transactions: UnsignedTx[];
  factory_address?: string;
  token_address?: string;
  token_symbol?: string;
}

export interface FundMarketResponse {
  market_id: string;
  contract_address: string;
  transactions: UnsignedTx[];
}

// Step 1: Prepare unsigned creation tx
export function prepareCreateMarket(body: {
  chain: string;
  question: string;
  option_a?: string;
  option_b?: string;
  end_time: string;
  token?: string;
  liquidity: number;
  image_url?: string;
  wallet_address: string;
}) {
  return request<PrepareCreateResponse>("/markets/create", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// Step 2: After signing creation tx, fund the market (get liquidity txs)
export function fundMarket(body: {
  creation_tx_hash: string;
  chain: string;
  wallet_address: string;
  token?: string;
  liquidity: number;
}) {
  return request<FundMarketResponse>("/markets/create/fund", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// Resolve market — returns unsigned tx
export function resolveMarket(
  contractAddress: string,
  body: { winning_outcome: string; wallet_address: string }
) {
  return request<{ transactions: UnsignedTx[] }>(
    `/markets/${encodeURIComponent(contractAddress)}/resolve`,
    { method: "POST", body: JSON.stringify(body) }
  );
}

// Claim winnings — returns unsigned tx
export function claimWinnings(
  contractAddress: string,
  body: { wallet_address: string }
) {
  return request<{ transactions: UnsignedTx[]; estimated_payout: number }>(
    `/markets/${encodeURIComponent(contractAddress)}/claim`,
    { method: "POST", body: JSON.stringify(body) }
  );
}
