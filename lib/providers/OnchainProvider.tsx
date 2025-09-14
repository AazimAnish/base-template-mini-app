'use client';

import { OnchainKitProvider } from '@coinbase/onchainkit';
import { ReactNode } from 'react';
import { base, baseSepolia } from 'viem/chains';

interface OnchainProviderProps {
  children: ReactNode;
}

export function OnchainProvider({ children }: OnchainProviderProps) {
  // Use Base mainnet in production, Sepolia for testing
  const chain = process.env.NODE_ENV === 'production' ? base : baseSepolia;
  
  const apiKey = process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY || process.env.NEXT_PUBLIC_CDP_API_KEY;

  return (
    <OnchainKitProvider
      apiKey={apiKey}
      chain={chain}
      schemaId="0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9" // Optional: for attestations
    >
      {children}
    </OnchainKitProvider>
  );
}