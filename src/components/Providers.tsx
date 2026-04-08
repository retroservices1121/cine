"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { base, baseSepolia } from "viem/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

const rawId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";
// Real Privy app IDs are 25+ chars. Reject obvious placeholders.
const PRIVY_APP_ID = rawId.length > 10 && !rawId.includes("your_") ? rawId : null;

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  if (!PRIVY_APP_ID) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        defaultChain: base,
        supportedChains: [base, baseSepolia],
        appearance: {
          walletChainType: "ethereum-only",
          theme: "dark",
          accentColor: "#2793fb",
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        loginMethods: ["email", "wallet", "google", "twitter"],
      }}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </PrivyProvider>
  );
}
