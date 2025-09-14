'use client';

import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
  WalletDropdownFundLink,
  WalletDropdownLink,
} from '@coinbase/onchainkit/wallet';
import {
  Address,
  Avatar,
  EthBalance,
  Identity,
  Name,
} from '@coinbase/onchainkit/identity';
import { cn } from '@/lib/utils';
import { useMiniApp } from '@/lib/miniapp/hooks';

interface WalletConnectProps {
  className?: string;
}

export function WalletConnect({ className }: WalletConnectProps) {
  const { isInFarcaster, userContext } = useMiniApp();

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Wallet>
        <ConnectWallet 
          className="min-w-[90px] bg-black hover:bg-gray-800 text-white rounded-xl font-medium px-4 py-2"
          text="Connect"
          withWalletAggregator={true}
        >
          <Avatar className="h-6 w-6" />
          <Name className="font-medium text-white" />
        </ConnectWallet>
        <WalletDropdown className="bg-white border border-gray-200 rounded-xl shadow-lg">
          <Identity className="px-4 py-3 border-b border-gray-100" hasCopyAddressOnClick>
            <Avatar className="h-8 w-8" />
            <Name className="font-medium text-black" />
            <Address className="text-gray-600 text-sm" />
            <EthBalance className="text-gray-700 text-sm font-medium" />
          </Identity>
          
          {/* Show Farcaster info if available */}
          {isInFarcaster && userContext && (
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-purple-600">
                Farcaster User
              </p>
              <p className="text-sm text-gray-600">
                @{userContext.username} (FID: {userContext.fid})
              </p>
            </div>
          )}
          
          <WalletDropdownLink
            icon="wallet"
            href="https://wallet.coinbase.com"
            rel="noopener noreferrer"
            target="_blank"
            className="px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"
          >
            Wallet
          </WalletDropdownLink>
          
          <WalletDropdownFundLink
            className="px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"
            fundingUrl="https://wallet.coinbase.com/buy"
            rel="noopener noreferrer"
            target="_blank"
          >
            Fund wallet
          </WalletDropdownFundLink>
          
          <WalletDropdownDisconnect 
            className="px-4 py-2 hover:bg-gray-50 text-sm text-red-600 border-t border-gray-100"
          />
        </WalletDropdown>
      </Wallet>
    </div>
  );
}