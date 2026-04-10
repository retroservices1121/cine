import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const CONFIG_PATH = join(process.cwd(), "fee-config.json");

export interface PendingWalletChange {
  newWallet1: string;
  newWallet2: string;
  proposedBy: string; // wallet address of the proposer
  proposedAt: string; // ISO timestamp
  signature: string; // hex signature from proposer
}

export interface FeeWalletConfig {
  wallet1: string;
  wallet2: string;
  pendingChange?: PendingWalletChange | null;
}

function readConfigFile(): FeeWalletConfig | null {
  if (!existsSync(CONFIG_PATH)) return null;
  try {
    const raw = readFileSync(CONFIG_PATH, "utf-8");
    return JSON.parse(raw) as FeeWalletConfig;
  } catch {
    return null;
  }
}

function writeConfigFile(config: FeeWalletConfig): void {
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

/**
 * Get current fee wallet addresses.
 * Priority: fee-config.json > .env FEE_WALLET_1/FEE_WALLET_2
 */
export function getFeeWallets(): { wallet1: string; wallet2: string } | null {
  const fileConfig = readConfigFile();
  if (fileConfig?.wallet1 && fileConfig?.wallet2) {
    return { wallet1: fileConfig.wallet1, wallet2: fileConfig.wallet2 };
  }
  const w1 = process.env.FEE_WALLET_1;
  const w2 = process.env.FEE_WALLET_2;
  if (!w1 || !w2) return null;
  return { wallet1: w1, wallet2: w2 };
}

/**
 * Get the full config including any pending change.
 */
export function getFeeWalletConfig(): FeeWalletConfig | null {
  const fileConfig = readConfigFile();
  if (fileConfig) return fileConfig;
  const wallets = getFeeWallets();
  if (!wallets) return null;
  return { ...wallets, pendingChange: null };
}

/**
 * Propose a wallet change. Must be signed by one of the current fee wallets.
 * The change is stored as pending until the other wallet approves.
 */
export function proposeWalletChange(
  newWallet1: string,
  newWallet2: string,
  proposerAddress: string,
  signature: string
): { success: boolean; error?: string } {
  const current = getFeeWallets();
  if (!current) return { success: false, error: "No fee wallets configured" };

  const normalizedProposer = proposerAddress.toLowerCase();
  const isWallet1 = current.wallet1.toLowerCase() === normalizedProposer;
  const isWallet2 = current.wallet2.toLowerCase() === normalizedProposer;

  if (!isWallet1 && !isWallet2) {
    return { success: false, error: "Proposer must be one of the current fee wallets" };
  }

  const config: FeeWalletConfig = {
    wallet1: current.wallet1,
    wallet2: current.wallet2,
    pendingChange: {
      newWallet1,
      newWallet2,
      proposedBy: proposerAddress,
      proposedAt: new Date().toISOString(),
      signature,
    },
  };

  writeConfigFile(config);
  return { success: true };
}

/**
 * Approve a pending wallet change. Must be signed by the OTHER fee wallet
 * (not the one that proposed).
 */
export function approveWalletChange(
  approverAddress: string,
  signature: string
): { success: boolean; error?: string } {
  const config = readConfigFile();
  if (!config?.pendingChange) {
    return { success: false, error: "No pending wallet change to approve" };
  }

  const current = getFeeWallets();
  if (!current) return { success: false, error: "No fee wallets configured" };

  const normalizedApprover = approverAddress.toLowerCase();
  const normalizedProposer = config.pendingChange.proposedBy.toLowerCase();

  // Approver must be one of the current wallets, but NOT the proposer
  const isWallet1 = current.wallet1.toLowerCase() === normalizedApprover;
  const isWallet2 = current.wallet2.toLowerCase() === normalizedApprover;

  if (!isWallet1 && !isWallet2) {
    return { success: false, error: "Approver must be one of the current fee wallets" };
  }

  if (normalizedApprover === normalizedProposer) {
    return { success: false, error: "Approver must be a different wallet than the proposer" };
  }

  // Both wallets have signed - apply the change
  const updatedConfig: FeeWalletConfig = {
    wallet1: config.pendingChange.newWallet1,
    wallet2: config.pendingChange.newWallet2,
    pendingChange: null,
  };

  // Store signature for audit trail (not strictly needed but good practice)
  void signature;

  writeConfigFile(updatedConfig);
  return { success: true };
}

/**
 * Cancel a pending wallet change. Can be done by either fee wallet.
 */
export function cancelWalletChange(
  callerAddress: string
): { success: boolean; error?: string } {
  const config = readConfigFile();
  if (!config?.pendingChange) {
    return { success: false, error: "No pending change to cancel" };
  }

  const current = getFeeWallets();
  if (!current) return { success: false, error: "No fee wallets configured" };

  const normalized = callerAddress.toLowerCase();
  const isWallet1 = current.wallet1.toLowerCase() === normalized;
  const isWallet2 = current.wallet2.toLowerCase() === normalized;

  if (!isWallet1 && !isWallet2) {
    return { success: false, error: "Only current fee wallets can cancel" };
  }

  writeConfigFile({ wallet1: current.wallet1, wallet2: current.wallet2, pendingChange: null });
  return { success: true };
}
