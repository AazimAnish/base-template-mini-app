'use client';

import {
  Transaction,
  TransactionButton,
  TransactionStatus,
  TransactionStatusAction,
  TransactionStatusLabel,
} from '@coinbase/onchainkit/transaction';
import { useState } from 'react';
import { parseEther, formatEther } from 'viem';
import { cn } from '@/lib/utils';
import { useGameFeatures } from '@/lib/miniapp/hooks';
import { Coins, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface StakeTransactionProps {
  gameId: `0x${string}`;
  stakeAmount: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  className?: string;
}

export function StakeTransaction({ 
  gameId, 
  stakeAmount, 
  onSuccess, 
  onError,
  className 
}: StakeTransactionProps) {
  const [isProcessing] = useState(false);
  const { onStakeConfirmed } = useGameFeatures();

  // Smart contract call data for joining game
  const joinGameCalls = [
    {
      to: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
      data: `0x${gameId.slice(2)}`, // Simplified - would need proper ABI encoding
      value: parseEther(stakeAmount),
    }
  ];

  const handleSuccess = async () => {
    try {
      await onStakeConfirmed(stakeAmount);
      onSuccess?.();
    } catch (error) {
      console.error('Post-transaction success handling failed:', error);
    }
  };

  const handleError = (error: Error) => {
    console.error('Transaction failed:', error);
    onError?.(error);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-xl border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Coins className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-black">Stake Amount</h3>
              <p className="text-2xl font-bold text-green-600">
                {stakeAmount} ETH
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Gas Optimized</p>
            <p className="text-xs text-green-600 font-medium">~$0.50 gas fee</p>
          </div>
        </div>
      </div>

      <Transaction
        calls={joinGameCalls}
        chainId={8453} // Base mainnet
        onSuccess={handleSuccess}
        onError={handleError}
      >
        <TransactionButton
          className="w-full h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium rounded-xl transition-all duration-200"
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Coins className="h-5 w-5 mr-2" />
              Stake {stakeAmount} ETH & Join Game
            </>
          )}
        </TransactionButton>

        <TransactionStatus className="mt-4">
          <TransactionStatusLabel className="flex items-center gap-2 text-sm" />
          <TransactionStatusAction className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800" />
        </TransactionStatus>
      </Transaction>

      <div className="text-center space-y-2">
        <p className="text-xs text-gray-500">
          Your stake will be held in escrow until the game ends
        </p>
        <p className="text-xs text-gray-400">
          Winners split the pot • Traitors can rug everything
        </p>
      </div>
    </div>
  );
}

interface PayoutTransactionProps {
  gameId: `0x${string}`;
  winners: `0x${string}`[];
  totalPot: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  className?: string;
}

export function PayoutTransaction({
  gameId,
  winners,
  totalPot,
  onSuccess,
  onError,
  className
}: PayoutTransactionProps) {
  // Contract call for distributing winnings
  const payoutCalls = [
    {
      to: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
      data: `0x${gameId.slice(2)}`, // Would need proper ABI encoding for payout
      value: BigInt(0),
    }
  ];

  const sharePerWinner = winners.length > 0 
    ? formatEther(parseEther(totalPot) / BigInt(winners.length))
    : '0';

  return (
    <div className={cn("space-y-4", className)}>
      <div className="bg-gradient-to-r from-yellow-50 to-green-50 p-4 rounded-xl border">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-6 w-6 text-yellow-600" />
          </div>
          <h3 className="font-medium text-black">Game Complete!</h3>
          <p className="text-3xl font-bold text-green-600">
            {sharePerWinner} ETH
          </p>
          <p className="text-sm text-gray-600">
            Your share of {totalPot} ETH pot
          </p>
        </div>
      </div>

      <Transaction
        calls={payoutCalls}
        chainId={8453}
        onSuccess={onSuccess}
        onError={onError}
      >
        <TransactionButton className="w-full h-12 bg-gradient-to-r from-yellow-500 to-green-500 hover:from-yellow-600 hover:to-green-600 text-white font-medium rounded-xl">
          <>
            <Coins className="h-5 w-5 mr-2" />
            Claim Winnings
          </>
        </TransactionButton>

        <TransactionStatus className="mt-4">
          <TransactionStatusLabel className="flex items-center gap-2 text-sm" />
          <TransactionStatusAction className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800" />
        </TransactionStatus>
      </Transaction>
    </div>
  );
}

interface RugTransactionProps {
  gameId: `0x${string}`;
  totalPot: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  className?: string;
}

export function RugTransaction({
  gameId,
  totalPot,
  onSuccess,
  onError,
  className
}: RugTransactionProps) {
  // Contract call for traitor rug
  const rugCalls = [
    {
      to: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
      data: `0x${gameId.slice(2)}`, // Would need proper ABI encoding for rug
      value: BigInt(0),
    }
  ];

  return (
    <div className={cn("space-y-4", className)}>
      <div className="bg-gradient-to-r from-red-50 to-purple-50 p-4 rounded-xl border border-red-200">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="font-medium text-black">Traitor Action</h3>
          <p className="text-3xl font-bold text-red-600">
            {totalPot} ETH
          </p>
          <p className="text-sm text-gray-600">
            Rug the entire pot now
          </p>
        </div>
      </div>

      <Transaction
        calls={rugCalls}
        chainId={8453}
        onSuccess={onSuccess}
        onError={onError}
      >
        <TransactionButton className="w-full h-12 bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700 text-white font-medium rounded-xl">
          <>
            <XCircle className="h-5 w-5 mr-2" />
            🦹‍♂️ RUG THE POT
          </>
        </TransactionButton>

        <TransactionStatus className="mt-4">
          <TransactionStatusLabel className="flex items-center gap-2 text-sm" />
          <TransactionStatusAction className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800" />
        </TransactionStatus>
      </Transaction>

      <div className="text-center">
        <p className="text-xs text-red-500 font-medium">
          ⚠️ This will end the game and take all ETH
        </p>
      </div>
    </div>
  );
}