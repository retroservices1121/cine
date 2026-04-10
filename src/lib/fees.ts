import { getFeeWallets } from "./fee-config";

// USDC on Base (6 decimals)
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_DECIMALS = 6;
const BASE_CHAIN_ID = 8453;

// Fee config
const FEE_BPS = 100; // 1% = 100 basis points
const WALLET1_SPLIT = 70; // 70%
const WALLET2_SPLIT = 30; // 30%

// Encode ERC-20 transfer(address,uint256) call
// Selector: 0xa9059cbb
function encodeTransfer(to: string, amountUsdcRaw: bigint): string {
  const selector = "a9059cbb";
  const addrPadded = to.replace("0x", "").toLowerCase().padStart(64, "0");
  const amountHex = amountUsdcRaw.toString(16).padStart(64, "0");
  return `0x${selector}${addrPadded}${amountHex}`;
}

function usdToRaw(usd: number): bigint {
  return BigInt(Math.floor(usd * 10 ** USDC_DECIMALS));
}

export interface FeeTx {
  to: string;
  data: string;
  value: string;
  gas: string;
  chain_id: number;
  description: string;
}

/**
 * Calculate fee transactions for a transaction amount.
 * 1% fee on every transaction, split 70/30 between wallet 1 and wallet 2.
 * Returns empty array if fee wallets aren't configured or amount <= 0.
 */
export function calculateFeeTxs(amountUsd: number): FeeTx[] {
  if (amountUsd <= 0) return [];

  const wallets = getFeeWallets();
  if (!wallets) return [];

  const totalFeeUsd = amountUsd * (FEE_BPS / 10000);
  if (totalFeeUsd < 0.01) return []; // Skip dust

  const wallet1Fee = totalFeeUsd * (WALLET1_SPLIT / 100);
  const wallet2Fee = totalFeeUsd * (WALLET2_SPLIT / 100);

  const txs: FeeTx[] = [];

  if (wallet1Fee >= 0.001) {
    txs.push({
      to: USDC_BASE,
      data: encodeTransfer(wallets.wallet1, usdToRaw(wallet1Fee)),
      value: "0",
      gas: "80000",
      chain_id: BASE_CHAIN_ID,
      description: `Platform fee (${wallet1Fee.toFixed(4)} USDC)`,
    });
  }

  if (wallet2Fee >= 0.001) {
    txs.push({
      to: USDC_BASE,
      data: encodeTransfer(wallets.wallet2, usdToRaw(wallet2Fee)),
      value: "0",
      gas: "80000",
      chain_id: BASE_CHAIN_ID,
      description: `Platform fee (${wallet2Fee.toFixed(4)} USDC)`,
    });
  }

  return txs;
}

/**
 * Get fee summary for display purposes.
 */
export function calculateFeeSummary(amountUsd: number) {
  if (amountUsd <= 0) return null;

  const totalFee = amountUsd * (FEE_BPS / 10000);
  return {
    amount: amountUsd,
    feePercent: FEE_BPS / 100,
    totalFee,
    wallet1Fee: totalFee * (WALLET1_SPLIT / 100),
    wallet2Fee: totalFee * (WALLET2_SPLIT / 100),
  };
}
