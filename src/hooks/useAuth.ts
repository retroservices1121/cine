"use client";

import { usePrivy, useSendTransaction } from "@privy-io/react-auth";

const rawId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";
const HAS_PRIVY = rawId.length > 10 && !rawId.includes("your_");

const NOOP_AUTH = {
  login: () => {},
  logout: () => {},
  ready: true,
  authenticated: false,
  user: null,
} as const;

const NOOP_SEND = {
  sendTransaction: async () => {
    throw new Error("Privy not configured");
  },
} as const;

export function useAuth() {
  if (!HAS_PRIVY) return NOOP_AUTH;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const privy = usePrivy();
  return privy;
}

export function useSendTx() {
  if (!HAS_PRIVY) return NOOP_SEND;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const tx = useSendTransaction();
  return tx;
}
