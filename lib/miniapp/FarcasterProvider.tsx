'use client';

import { ReactNode, useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

interface FarcasterProviderProps {
  children: ReactNode;
}

export function FarcasterProvider({ children }: FarcasterProviderProps) {
  useEffect(() => {
    const initializeFarcaster = async () => {
      try {
        // Initialize the Farcaster SDK
        await sdk.actions.ready();
        console.log('Farcaster SDK initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Farcaster SDK:', error);
      }
    };

    initializeFarcaster();
  }, []);

  return <>{children}</>;
}