// USDC on Base (6 decimals)
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_DECIMALS = 6;
const BASE_CHAIN_ID = 8453;

// Fee config
const FEE_BPS = 100; // 1% = 100 basis points
const ADMIN1_SPLIT = 60; // 60%
const ADMIN2_SPLIT = 40; // 40%

function getAdminWallets() {
  const admin1 = process.env.FEE_WALLET_1;
  const admin2 = process.env.FEE_WALLET_2;
  if (!admin1 || !admin2) return null;
  return { admin1, admin2 };
}

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
 * Calculate fee transactions for a profitable amount.
 * Returns empty array if fee wallets aren't configured or profit <= 0.
 */
export function calculateFeeTxs(profitUsd: number): FeeTx[] {
  if (profitUsd <= 0) return [];

  const wallets = getAdminWallets();
  if (!wallets) return [];

  const totalFeeUsd = profitUsd * (FEE_BPS / 10000);
  if (totalFeeUsd < 0.01) return []; // Skip dust

  const admin1Fee = totalFeeUsd * (ADMIN1_SPLIT / 100);
  const admin2Fee = totalFeeUsd * (ADMIN2_SPLIT / 100);

  const txs: FeeTx[] = [];

  if (admin1Fee >= 0.001) {
    txs.push({
      to: USDC_BASE,
      data: encodeTransfer(wallets.admin1, usdToRaw(admin1Fee)),
      value: "0",
      gas: "80000",
      chain_id: BASE_CHAIN_ID,
      description: `Platform fee (${admin1Fee.toFixed(4)} USDC)`,
    });
  }

  if (admin2Fee >= 0.001) {
    txs.push({
      to: USDC_BASE,
      data: encodeTransfer(wallets.admin2, usdToRaw(admin2Fee)),
      value: "0",
      gas: "80000",
      chain_id: BASE_CHAIN_ID,
      description: `Platform fee (${admin2Fee.toFixed(4)} USDC)`,
    });
  }

  return txs;
}

/**
 * Get fee summary for display purposes.
 */
export function calculateFeeSummary(profitUsd: number) {
  if (profitUsd <= 0) return null;

  const totalFee = profitUsd * (FEE_BPS / 10000);
  return {
    profit: profitUsd,
    feePercent: FEE_BPS / 100,
    totalFee,
    admin1Fee: totalFee * (ADMIN1_SPLIT / 100),
    admin2Fee: totalFee * (ADMIN2_SPLIT / 100),
  };
}
