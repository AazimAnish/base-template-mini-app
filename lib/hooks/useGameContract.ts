'use client';

import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { SUS_GAME_CONTRACT, generateGameId } from '../contracts';
// import { useGameStore } from '../stores/gameStore';
import { toast } from 'sonner';

export function useGameContract() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const createGame = async (stakeAmount: string, maxPlayers: number) => {
    const gameId = generateGameId(`${Date.now()}`);
    
    try {
      writeContract({
        address: SUS_GAME_CONTRACT.address,
        abi: SUS_GAME_CONTRACT.abi,
        functionName: 'createGame',
        args: [gameId, maxPlayers],
        value: parseEther(stakeAmount),
      });
      
      return gameId;
    } catch (err) {
      toast.error('Failed to create game');
      throw err;
    }
  };

  const joinGame = async (gameId: `0x${string}`, stakeAmount: string) => {
    try {
      writeContract({
        address: SUS_GAME_CONTRACT.address,
        abi: SUS_GAME_CONTRACT.abi,
        functionName: 'joinGame',
        args: [gameId],
        value: parseEther(stakeAmount),
      });
    } catch (err) {
      toast.error('Failed to join game');
      throw err;
    }
  };

  const startGame = async (gameId: `0x${string}`) => {
    try {
      writeContract({
        address: SUS_GAME_CONTRACT.address,
        abi: SUS_GAME_CONTRACT.abi,
        functionName: 'startGame',
        args: [gameId],
      });
    } catch (err) {
      toast.error('Failed to start game');
      throw err;
    }
  };

  const rugPot = async (gameId: `0x${string}`) => {
    try {
      writeContract({
        address: SUS_GAME_CONTRACT.address,
        abi: SUS_GAME_CONTRACT.abi,
        functionName: 'rugGame',
        args: [gameId],
      });
    } catch (err) {
      toast.error('Failed to rug pot');
      throw err;
    }
  };

  const endGame = async (gameId: `0x${string}`, winners: `0x${string}`[]) => {
    try {
      writeContract({
        address: SUS_GAME_CONTRACT.address,
        abi: SUS_GAME_CONTRACT.abi,
        functionName: 'endGame',
        args: [gameId, winners],
      });
    } catch (err) {
      toast.error('Failed to end game');
      throw err;
    }
  };

  return {
    createGame,
    joinGame,
    startGame,
    rugPot,
    endGame,
    isPending: isPending || isConfirming,
    isConfirmed,
    error,
    hash,
  };
}

export function useGameData(gameId: `0x${string}` | null) {
  const { data: gameData, isLoading, error } = useReadContract({
    address: SUS_GAME_CONTRACT.address,
    abi: SUS_GAME_CONTRACT.abi,
    functionName: 'getGame',
    args: gameId ? [gameId] : undefined,
    query: {
      enabled: !!gameId,
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  });

  return {
    gameData,
    isLoading,
    error,
  };
}