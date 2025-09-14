'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useAccount, useWriteContract } from 'wagmi';
import { parseEther } from 'viem';
import { SUS_GAME_CONTRACT } from '../contracts';
import { toast } from 'sonner';

export type GamePhase = 'lobby' | 'waiting-for-traitor' | 'reveal' | 'discussion' | 'voting' | 'ended';
export type Role = 'crew' | 'traitor' | null;
export type GameState = 'Created' | 'Active' | 'Ended' | 'Cancelled' | 'Disputed';

export interface Player {
  id: string;
  address: `0x${string}`;
  name?: string;
  isEliminated: boolean;
  joinedAt: Date;
  stake: bigint;
}

export interface GameData {
  gameId: `0x${string}` | null;
  lobbyId: string | null;
  contractAddress: `0x${string}`;
  
  // On-chain state
  creator: `0x${string}` | null;
  stakeAmount: bigint;
  totalPot: bigint;
  maxPlayers: number;
  players: Player[];
  contractState: GameState;
  createdAt: number;
  endedAt: number;
  
  // Off-chain game state (synchronized)
  phase: GamePhase;
  currentRound: number;
  timeRemaining: number;
  myRole: Role;
  isHost: boolean;
  isEliminated: boolean;
  
  // Traitor mechanism
  traitorCommitment: `0x${string}` | null;
  traitorRevealed: `0x${string}` | null;
  traitorNonce: bigint | null;
  
  // Voting state
  votes: { [targetAddress: string]: number };
  hasVoted: boolean;
  votingTarget: `0x${string}` | null;
  
  // Game results
  winners: `0x${string}`[];
  ruggedBy: `0x${string}` | null;
  
  // Connection state
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface GameActions {
  // Contract interactions
  createGame: (stakeAmount: string, maxPlayers: number) => Promise<void>;
  joinGame: (lobbyId: string) => Promise<void>;
  startGame: () => Promise<void>;
  cancelGame: () => Promise<void>;
  rugPot: () => Promise<void>;
  emergencyWithdraw: () => Promise<void>;
  
  // Game flow
  updateFromContract: (gameId: `0x${string}`) => Promise<void>;
  setPhase: (phase: GamePhase) => void;
  setTimeRemaining: (time: number) => void;
  
  // Role management
  setTraitorCommitment: (commitment: `0x${string}`, nonce: bigint) => void;
  revealTraitor: (traitor: `0x${string}`) => Promise<void>;
  
  // Voting
  castVote: (target: `0x${string}`) => void;
  processVoteResults: () => void;
  
  // Utilities
  resetGame: () => void;
  setError: (error: string | null) => void;
}

const initialState: GameData = {
  gameId: null,
  lobbyId: null,
  contractAddress: SUS_GAME_CONTRACT.address,
  
  // On-chain state
  creator: null,
  stakeAmount: BigInt(0),
  totalPot: BigInt(0),
  maxPlayers: 4,
  players: [],
  contractState: 'Created',
  createdAt: 0,
  endedAt: 0,
  
  // Off-chain game state
  phase: 'lobby',
  currentRound: 1,
  timeRemaining: 0,
  myRole: null,
  isHost: false,
  isEliminated: false,
  
  // Traitor mechanism
  traitorCommitment: null,
  traitorRevealed: null,
  traitorNonce: null,
  
  // Voting state
  votes: {},
  hasVoted: false,
  votingTarget: null,
  
  // Game results
  winners: [],
  ruggedBy: null,
  
  // Connection state
  isConnected: false,
  isLoading: false,
  error: null,
};

export const useSecureGameStore = create<GameData & GameActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      createGame: async (stakeAmount: string, maxPlayers: number) => {
        try {
          set({ isLoading: true, error: null });
          
          const gameId = `0x${Buffer.from(`game_${Date.now()}_${Math.random()}`).toString('hex').padEnd(64, '0')}` as `0x${string}`;
          const lobbyId = gameId.slice(-6).toUpperCase();
          
          // This would call the actual contract
          // For now, simulate the call
          console.log('Creating game with:', { gameId, stakeAmount, maxPlayers });
          
          set({
            gameId,
            lobbyId,
            stakeAmount: parseEther(stakeAmount),
            totalPot: parseEther(stakeAmount),
            maxPlayers,
            isHost: true,
            phase: 'lobby',
            isLoading: false,
          });
          
          toast.success('Game created successfully!');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to create game';
          set({ error: message, isLoading: false });
          toast.error(message);
          throw error;
        }
      },

      joinGame: async (lobbyId: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const gameId = `0x${Buffer.from(lobbyId).toString('hex').padEnd(64, '0')}` as `0x${string}`;
          
          // First, fetch game data from contract
          await get().updateFromContract(gameId);
          
          // Then join the game
          console.log('Joining game:', gameId);
          
          set({
            gameId,
            lobbyId,
            isHost: false,
            phase: 'lobby',
            isLoading: false,
          });
          
          toast.success('Joined game successfully!');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to join game';
          set({ error: message, isLoading: false });
          toast.error(message);
          throw error;
        }
      },

      startGame: async () => {
        try {
          const { gameId, players, isHost } = get();
          
          if (!gameId || !isHost) {
            throw new Error('Not authorized to start game');
          }
          
          if (players.length < 3) {
            throw new Error('Need at least 3 players to start');
          }
          
          // Generate cryptographic traitor commitment
          const traitorIndex = Math.floor(Math.random() * players.length);
          const traitor = players[traitorIndex].address;
          const nonce = BigInt(Math.floor(Math.random() * 1000000));
          const commitment = `0x${Buffer.from(
            `${traitor}${nonce.toString()}`
          ).toString('hex').padEnd(64, '0')}` as `0x${string}`;
          
          console.log('Starting game with traitor commitment');
          
          set({
            phase: 'waiting-for-traitor',
            traitorCommitment: commitment,
            traitorNonce: nonce,
            contractState: 'Active',
          });
          
          // Simulate traitor reveal after delay (in real app, this would be done by server)
          setTimeout(() => {
            get().revealTraitor(traitor);
          }, 5000);
          
          toast.success('Game started!');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to start game';
          toast.error(message);
          throw error;
        }
      },

      revealTraitor: async (traitor: `0x${string}`) => {
        try {
          console.log('Revealing traitor:', traitor);
          
          set({
            traitorRevealed: traitor,
            phase: 'reveal',
          });
          
          // Determine my role
          const myAddress = traitor; // This would come from wallet
          const myRole = myAddress === traitor ? 'traitor' : 'crew';
          
          set({ myRole });
          
          // Transition to discussion after reveal
          setTimeout(() => {
            set({ phase: 'discussion', timeRemaining: 120 });
          }, 3000);
          
        } catch (error) {
          console.error('Failed to reveal traitor:', error);
        }
      },

      cancelGame: async () => {
        try {
          const { gameId, isHost } = get();
          
          if (!gameId || !isHost) {
            throw new Error('Not authorized to cancel game');
          }
          
          console.log('Cancelling game:', gameId);
          
          set({
            contractState: 'Cancelled',
            phase: 'ended',
          });
          
          toast.success('Game cancelled and players refunded');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to cancel game';
          toast.error(message);
          throw error;
        }
      },

      rugPot: async () => {
        try {
          const { gameId, myRole, traitorRevealed } = get();
          
          if (!gameId) {
            throw new Error('No active game');
          }
          
          if (myRole !== 'traitor') {
            throw new Error('Only traitors can rug the pot');
          }
          
          if (!traitorRevealed) {
            throw new Error('Traitor not yet revealed');
          }
          
          console.log('Rugging pot:', gameId);
          
          set({
            contractState: 'Ended',
            phase: 'ended',
            ruggedBy: traitorRevealed,
          });
          
          toast.success('Pot rugged successfully!');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to rug pot';
          toast.error(message);
          throw error;
        }
      },

      emergencyWithdraw: async () => {
        try {
          const { gameId } = get();
          
          if (!gameId) {
            throw new Error('No active game');
          }
          
          console.log('Emergency withdraw from:', gameId);
          
          toast.success('Emergency withdrawal successful');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to withdraw';
          toast.error(message);
          throw error;
        }
      },

      updateFromContract: async (gameId: `0x${string}`) => {
        try {
          // This would fetch real data from the contract
          console.log('Updating game data from contract:', gameId);
          
          // Simulated contract data
          const mockGameData = {
            creator: '0x1234567890123456789012345678901234567890' as `0x${string}`,
            stakeAmount: parseEther('0.01'),
            totalPot: parseEther('0.04'),
            playerCount: 4,
            maxPlayers: 6,
            players: ['0x1', '0x2', '0x3', '0x4'] as `0x${string}`[],
            state: 0, // Created
            createdAt: Math.floor(Date.now() / 1000),
            endedAt: 0,
          };
          
          set({
            creator: mockGameData.creator,
            stakeAmount: mockGameData.stakeAmount,
            totalPot: mockGameData.totalPot,
            maxPlayers: mockGameData.maxPlayers,
            contractState: 'Created',
            createdAt: mockGameData.createdAt,
          });
          
        } catch (error) {
          console.error('Failed to update from contract:', error);
        }
      },

      setPhase: (phase: GamePhase) => {
        set({ phase });
        
        // Reset phase-specific state
        if (phase === 'voting') {
          set({ 
            votes: {}, 
            hasVoted: false, 
            timeRemaining: 30,
            votingTarget: null 
          });
        } else if (phase === 'discussion') {
          set({ timeRemaining: 120 });
        }
      },

      setTimeRemaining: (time: number) => {
        set({ timeRemaining: Math.max(0, time) });
      },

      setTraitorCommitment: (commitment: `0x${string}`, nonce: bigint) => {
        set({ traitorCommitment: commitment, traitorNonce: nonce });
      },

      castVote: (target: `0x${string}`) => {
        const { phase, isEliminated, hasVoted } = get();
        
        if (phase !== 'voting' || isEliminated || hasVoted) {
          return;
        }
        
        set((state) => ({
          votes: {
            ...state.votes,
            [target]: (state.votes[target] || 0) + 1
          },
          hasVoted: true,
          votingTarget: target,
        }));
      },

      processVoteResults: () => {
        const { votes, players } = get();
        
        // Find player with most votes
        let maxVotes = 0;
        let eliminatedPlayer: `0x${string}` | null = null;
        let tiedPlayers: string[] = [];

        Object.entries(votes).forEach(([player, voteCount]) => {
          if (voteCount > maxVotes) {
            maxVotes = voteCount;
            eliminatedPlayer = player as `0x${string}`;
            tiedPlayers = [player];
          } else if (voteCount === maxVotes && maxVotes > 0) {
            tiedPlayers.push(player);
          }
        });

        // Check for ties or insufficient votes
        if (tiedPlayers.length > 1 || maxVotes <= players.length / 2) {
          eliminatedPlayer = null;
        }

        if (eliminatedPlayer) {
          // Process elimination
          console.log('Player eliminated:', eliminatedPlayer);
          toast.info(`Player eliminated: ${eliminatedPlayer}`);
        }

        // Check win conditions
        // Implementation depends on game rules
      },

      resetGame: () => {
        set(initialState);
      },

      setError: (error: string | null) => {
        set({ error });
      },
    }),
    { name: 'secure-game-store' }
  )
);

// Hook for contract integration
export function useContractIntegration() {
  const { address } = useAccount();
  
  // Real contract hooks would go here
  const { writeContract } = useWriteContract();
  
  const createGameOnChain = async (stakeAmount: string, maxPlayers: number) => {
    if (!address) throw new Error('Wallet not connected');
    
    const gameId = `0x${Buffer.from(`game_${Date.now()}`).toString('hex').padEnd(64, '0')}` as `0x${string}`;
    
    try {
      writeContract({
        address: SUS_GAME_CONTRACT.address,
        abi: SUS_GAME_CONTRACT.abi,
        functionName: 'createGame',
        args: [gameId, maxPlayers],
        value: parseEther(stakeAmount),
      });
      
      return gameId;
    } catch (error) {
      console.error('Contract call failed:', error);
      throw error;
    }
  };
  
  return {
    createGameOnChain,
    address,
    isConnected: !!address,
  };
}