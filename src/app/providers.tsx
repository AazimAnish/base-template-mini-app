"use client";

import dynamic from "next/dynamic";
import { MiniAppProvider } from "@neynar/react";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { baseSepolia } from "wagmi/chains";

const WagmiProvider = dynamic(
  () => import("~/components/providers/WagmiProvider"),
  {
    ssr: false,
  }
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider>
      <OnchainKitProvider
        apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
        chain={baseSepolia}
      >
        <MiniAppProvider analyticsEnabled={true}>{children}</MiniAppProvider>
      </OnchainKitProvider>
    </WagmiProvider>
  );
}
