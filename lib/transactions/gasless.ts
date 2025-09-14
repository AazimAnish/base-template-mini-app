'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { encodeFunctionData, type Hex } from 'viem';

// Base Paymaster configuration (for future use)
// const PAYMASTER_URL = 'https://paymaster.base.org'; // Base's official paymaster
// const BUNDLER_URL = 'https://bundler.base.org'; // Base's bundler for ERC-4337

interface GaslessTransactionConfig {
  to: `0x${string}`;
  data: Hex;
  value?: bigint;
  chainId?: number;
}

interface GaslessTransactionResult {
  hash: `0x${string}` | null;
  isLoading: boolean;
  isSuccess: boolean;
  error: Error | null;
  gasEstimate: string | null;
  executeGasless: () => Promise<void>;
  executeRegular: () => Promise<void>;
}

export function useGaslessTransaction(config: GaslessTransactionConfig): GaslessTransactionResult {
  const { address, isConnected } = useAccount();
  const [result, setResult] = useState<{
    hash: `0x${string}` | null;
    isLoading: boolean;
    isSuccess: boolean;
    error: Error | null;
    gasEstimate: string | null;
  }>({
    hash: null,
    isLoading: false,
    isSuccess: false,
    error: null,
    gasEstimate: null,
  });

  const { writeContract, data: txHash } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Check if gasless transactions are supported
  const [gaslessSupported, setGaslessSupported] = useState(false);

  useEffect(() => {
    checkGaslessSupport();
  }, []);

  const checkGaslessSupport = async () => {
    try {
      // Check if the user's wallet supports ERC-4337 (Account Abstraction)
      if (typeof window !== 'undefined' && (window as { ethereum?: unknown }).ethereum) {
        // Simple check for smart wallet support
        const provider = (window as { ethereum?: { isSmartWallet?: boolean; isCoinbaseWallet?: boolean } }).ethereum;
        const isSmartWallet = Boolean(provider.isSmartWallet || provider.isCoinbaseWallet);
        setGaslessSupported(isSmartWallet);
      }
    } catch (error) {
      console.warn('Gasless support check failed:', error);
      setGaslessSupported(false);
    }
  };

  const estimateGas = useCallback(async () => {
    try {
      // This would normally estimate gas using the actual provider
      // For now, we'll use typical gas estimates for game operations
      const gasEstimates = {
        createGame: '180000',
        joinGame: '85000', 
        endGame: '95000',
        rugPot: '45000',
        vote: '35000',
      };

      // Simple heuristic based on data size
      const dataSize = config.data.length;
      let estimate = '50000'; // Base estimate
      
      if (dataSize > 200) estimate = gasEstimates.endGame;
      else if (dataSize > 100) estimate = gasEstimates.joinGame;
      else estimate = gasEstimates.vote;

      setResult(prev => ({ ...prev, gasEstimate: estimate }));
    } catch (error) {
      console.error('Gas estimation failed:', error);
    }
  }, [config]);

  // Estimate gas costs
  useEffect(() => {
    if (config && isConnected) {
      estimateGas();
    }
  }, [config, isConnected, estimateGas]);

  const executeGasless = async () => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }

    setResult(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      if (!gaslessSupported) {
        // Fallback to sponsored transactions
        await executeSponsoredTransaction();
      } else {
        // Use ERC-4337 Account Abstraction
        await executeUserOperation();
      }
    } catch (error) {
      console.error('Gasless transaction failed:', error);
      setResult(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Transaction failed'),
      }));
    }
  };

  const executeSponsoredTransaction = async () => {
    try {
      // For sponsored transactions, we use Base's paymaster service
      const sponsorshipResponse = await fetch('/api/paymaster/sponsor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: config.to,
          data: config.data,
          value: config.value?.toString() || '0',
          from: address,
        }),
      });

      if (!sponsorshipResponse.ok) {
        throw new Error('Sponsorship request failed');
      }

      const { sponsored, transactionHash } = await sponsorshipResponse.json();

      if (sponsored && transactionHash) {
        setResult(prev => ({
          ...prev,
          hash: transactionHash,
          isLoading: false,
          isSuccess: true,
        }));
      } else {
        // Fallback to regular transaction
        await executeRegular();
      }
    } catch (error) {
      console.error('Sponsored transaction failed, falling back to regular:', error);
      await executeRegular();
    }
  };

  const executeUserOperation = async () => {
    try {
      // ERC-4337 User Operation (for smart wallets)
      const userOperation = {
        sender: address,
        nonce: '0x0', // Would need to fetch actual nonce
        initCode: '0x',
        callData: config.data,
        callGasLimit: result.gasEstimate || '100000',
        verificationGasLimit: '100000',
        preVerificationGas: '21000',
        maxFeePerGas: '20000000000', // 20 gwei
        maxPriorityFeePerGas: '1000000000', // 1 gwei
        paymasterAndData: '0x', // Paymaster data would go here
        signature: '0x',
      };

      // This would normally use the bundler to submit the user operation
      console.log('User Operation:', userOperation);
      
      // For now, fallback to regular transaction
      await executeRegular();
    } catch (error) {
      console.error('User operation failed:', error);
      await executeRegular();
    }
  };

  const executeRegular = async () => {
    try {
      if (config.value && config.value > 0) {
        await writeContract({
          address: config.to,
          abi: [
            {
              name: 'execute',
              type: 'function',
              inputs: [],
              outputs: [],
              stateMutability: 'payable',
            },
          ] as const,
          functionName: 'execute',
          value: config.value,
        });
      } else {
        await writeContract({
          address: config.to,
          abi: [
            {
              name: 'execute',
              type: 'function',
              inputs: [],
              outputs: [],
              stateMutability: 'nonpayable',
            },
          ] as const,
          functionName: 'execute',
        });
      }

      setResult(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      setResult(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Transaction failed'),
      }));
    }
  };

  // Update success state when transaction confirms
  useEffect(() => {
    if (isSuccess && txHash) {
      setResult(prev => ({
        ...prev,
        hash: txHash,
        isSuccess: true,
        isLoading: false,
      }));
    }
  }, [isSuccess, txHash]);

  // Update loading state
  useEffect(() => {
    setResult(prev => ({ ...prev, isLoading: isConfirming }));
  }, [isConfirming]);

  return {
    ...result,
    executeGasless,
    executeRegular,
  };
}

// Hook for checking gasless eligibility
export function useGaslessEligibility() {
  const { address } = useAccount();
  const [isEligible, setIsEligible] = useState(false);
  const [reason, setReason] = useState<string | null>(null);

  const checkEligibility = useCallback(async () => {
    try {
      const response = await fetch('/api/paymaster/eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });

      const { eligible, reason: eligibilityReason } = await response.json();
      setIsEligible(eligible);
      setReason(eligibilityReason);
    } catch (error) {
      console.error('Failed to check gasless eligibility:', error);
      setIsEligible(false);
      setReason('Unable to verify eligibility');
    }
  }, [address]);

  useEffect(() => {
    if (address) {
      checkEligibility();
    }
  }, [address, checkEligibility]);

  return { isEligible, reason, refetch: checkEligibility };
}

// Utility for creating optimized transaction data
export function createGameTransactionData(
  functionName: string,
  params: unknown[]
): Hex {
  // Game contract ABI fragments
  const gameAbi = [
    {
      name: 'createGame',
      type: 'function',
      inputs: [
        { name: 'gameId', type: 'bytes32' },
        { name: 'maxPlayers', type: 'uint8' },
      ],
      outputs: [],
      stateMutability: 'payable',
    },
    {
      name: 'joinGame',
      type: 'function',
      inputs: [{ name: 'gameId', type: 'bytes32' }],
      outputs: [],
      stateMutability: 'payable',
    },
    {
      name: 'endGame',
      type: 'function',
      inputs: [
        { name: 'gameId', type: 'bytes32' },
        { name: 'winners', type: 'address[]' },
      ],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      name: 'rugPot',
      type: 'function',
      inputs: [{ name: 'gameId', type: 'bytes32' }],
      outputs: [],
      stateMutability: 'nonpayable',
    },
  ];

  const functionAbi = gameAbi.find(f => f.name === functionName);
  if (!functionAbi) {
    throw new Error(`Function ${functionName} not found in ABI`);
  }

  return encodeFunctionData({
    abi: [functionAbi],
    functionName,
    args: params,
  });
}