'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { GameStore, Player, Message, Vote, GamePhase, Role } from '../types/game';

const generateGameId = () => `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const initialState = {
  gameId: null,
  lobbyId: null,
  stakeAmount: BigInt(0),
  potSize: BigInt(0),
  maxPlayers: 4,
  
  // Game flow
  phase: 'lobby' as GamePhase,
  timeRemaining: 0,
  currentRound: 1,
  
  // Players
  players: [],
  myPlayerId: null,
  myRole: null as Role,
  isHost: false,
  isEliminated: false,
  
  // Chat
  messages: [],
  unreadCount: 0,
  
  // Voting
  votes: [],
  votingTarget: null,
  hasVoted: false,
  
  // Game results
  winners: [],
  isGameEnded: false,
  ruggedBy: null,
};

export const useGameStore = create<GameStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Game management
        createGame: async (stakeAmount: bigint, maxPlayers: number) => {
          const gameId = generateGameId();
          const lobbyId = gameId.slice(-6).toUpperCase();
          
          set({
            gameId,
            lobbyId,
            stakeAmount,
            potSize: stakeAmount,
            maxPlayers,
            isHost: true,
            phase: 'lobby',
          });

          // Add creator as first player
          const creatorPlayer: Player = {
            id: 'me',
            address: '', // Will be set by wallet connection
            name: 'You',
            isEliminated: false,
            isReady: true,
            joinedAt: new Date(),
          };

          get().addPlayer(creatorPlayer);
          set({ myPlayerId: 'me' });
        },

        joinGame: async (lobbyId: string) => {
          const gameId = `game_${lobbyId.toLowerCase()}`;
          
          set({
            gameId,
            lobbyId,
            isHost: false,
            phase: 'lobby',
          });

          const player: Player = {
            id: 'me',
            address: '', // Will be set by wallet connection
            name: 'You',
            isEliminated: false,
            isReady: false,
            joinedAt: new Date(),
          };

          get().addPlayer(player);
          set({ myPlayerId: 'me' });
        },

        leaveGame: () => {
          set(initialState);
        },

        startGame: async () => {
          const { players } = get();
          if (players.length < 3) {
            throw new Error('Need at least 3 players to start');
          }

          set({ phase: 'reveal' });
          
          // Role assignment will be handled by server
          setTimeout(() => {
            set({ phase: 'discussion', timeRemaining: 120 }); // 2 minutes discussion
          }, 3000); // 3 seconds for role reveal
        },

        // Game flow
        setPhase: (phase: GamePhase) => {
          set({ phase });
          
          // Reset phase-specific state
          if (phase === 'voting') {
            set({ votes: [], hasVoted: false, timeRemaining: 30 });
          } else if (phase === 'discussion') {
            set({ timeRemaining: 120 });
          }
        },

        setTimeRemaining: (time: number) => {
          set({ timeRemaining: Math.max(0, time) });
        },

        nextRound: () => {
          set((state) => ({
            currentRound: state.currentRound + 1,
            phase: 'discussion',
            timeRemaining: 120,
            votes: [],
            hasVoted: false,
            votingTarget: null,
          }));
        },

        // Player management
        addPlayer: (player: Player) => {
          set((state) => {
            const existingIndex = state.players.findIndex(p => p.id === player.id);
            if (existingIndex >= 0) {
              const updatedPlayers = [...state.players];
              updatedPlayers[existingIndex] = player;
              return { players: updatedPlayers };
            }
            
            const newPlayers = [...state.players, player];
            const newPotSize = state.stakeAmount * BigInt(newPlayers.length);
            
            return { 
              players: newPlayers,
              potSize: newPotSize,
            };
          });
        },

        removePlayer: (playerId: string) => {
          set((state) => ({
            players: state.players.filter(p => p.id !== playerId),
          }));
        },

        setPlayerReady: (playerId: string, ready: boolean) => {
          set((state) => ({
            players: state.players.map(p =>
              p.id === playerId ? { ...p, isReady: ready } : p
            ),
          }));
        },

        setMyRole: (role: Role) => {
          set({ myRole: role });
        },

        eliminatePlayer: (playerId: string) => {
          set((state) => {
            const updatedPlayers = state.players.map(p =>
              p.id === playerId ? { ...p, isEliminated: true } : p
            );
            
            const isMyPlayer = playerId === state.myPlayerId;
            
            return {
              players: updatedPlayers,
              isEliminated: isMyPlayer ? true : state.isEliminated,
            };
          });

          // Add system message
          const player = get().players.find(p => p.id === playerId);
          if (player) {
            get().addMessage({
              id: `elimination_${Date.now()}`,
              playerId: 'system',
              playerName: 'Game',
              content: `${player.name || player.address} has been eliminated`,
              timestamp: new Date(),
              type: 'elimination',
            });
          }
        },

        // Chat
        sendMessage: (content: string) => {
          const myPlayer = get().players.find(p => p.id === get().myPlayerId);
          if (!myPlayer || get().isEliminated) return;

          const message: Message = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            playerId: myPlayer.id,
            playerName: myPlayer.name || myPlayer.address,
            content,
            timestamp: new Date(),
            type: 'chat',
          };

          get().addMessage(message);
        },

        addMessage: (message: Message) => {
          set((state) => ({
            messages: [...state.messages, message],
            unreadCount: message.playerId !== state.myPlayerId 
              ? state.unreadCount + 1 
              : state.unreadCount,
          }));
        },

        clearUnread: () => {
          set({ unreadCount: 0 });
        },

        // Voting
        castVote: (targetId: string) => {
          const { myPlayerId, isEliminated, hasVoted, phase } = get();
          
          if (phase !== 'voting' || isEliminated || hasVoted || !myPlayerId) {
            return;
          }

          const vote: Vote = {
            voterId: myPlayerId,
            targetId,
            timestamp: new Date(),
          };

          set((state) => ({
            votes: [...state.votes, vote],
            hasVoted: true,
            votingTarget: targetId,
          }));
        },

        clearVotes: () => {
          set({ votes: [], hasVoted: false, votingTarget: null });
        },

        setVotingTarget: (targetId: string | null) => {
          set({ votingTarget: targetId });
        },

        // Game ending
        endGame: (winners: string[], ruggedBy?: string) => {
          set({
            isGameEnded: true,
            winners,
            ruggedBy: ruggedBy || null,
            phase: 'ended',
          });

          // Add victory message
          const message: Message = {
            id: `victory_${Date.now()}`,
            playerId: 'system',
            playerName: 'Game',
            content: ruggedBy 
              ? `Game ended! ${ruggedBy} rugged the pot!` 
              : `Game ended! Winners: ${winners.join(', ')}`,
            timestamp: new Date(),
            type: 'victory',
          };

          get().addMessage(message);
        },

        rugPot: async () => {
          const { myPlayerId, myRole } = get();
          
          if (myRole !== 'traitor' || !myPlayerId) {
            throw new Error('Only traitors can rug the pot');
          }

          // This would call the smart contract
          // For now, just end the game with traitor as winner
          get().endGame([myPlayerId], myPlayerId);
        },

        // Reset
        resetGame: () => {
          set(initialState);
        },
      }),
      {
        name: 'sus-game-store',
        partialize: (state) => ({
          gameId: state.gameId,
          lobbyId: state.lobbyId,
          myPlayerId: state.myPlayerId,
          myRole: state.myRole,
          // Don't persist temporary states like messages, votes, etc.
        }),
      }
    ),
    { name: 'sus-game-store' }
  )
);