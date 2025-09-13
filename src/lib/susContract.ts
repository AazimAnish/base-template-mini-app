import { Address } from "viem";

// Contract ABI for SUS Game
export const SUS_GAME_ABI = [
  {
    "inputs": [
      {"name": "lobbyId", "type": "string"},
      {"name": "stakeAmount", "type": "uint256"}
    ],
    "name": "createGame",
    "outputs": [{"name": "", "type": "bytes32"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "gameId", "type": "bytes32"}],
    "name": "joinGame",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"name": "gameId", "type": "bytes32"}],
    "name": "startGame",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "gameId", "type": "bytes32"}],
    "name": "rug",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "gameId", "type": "bytes32"}],
    "name": "startVote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "gameId", "type": "bytes32"},
      {"name": "targetPlayer", "type": "uint256"}
    ],
    "name": "vote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "gameId", "type": "bytes32"}],
    "name": "endVote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "gameId", "type": "bytes32"}],
    "name": "getGameState",
    "outputs": [
      {"name": "host", "type": "address"},
      {"name": "state", "type": "uint8"},
      {"name": "pot", "type": "uint256"},
      {"name": "playerCount", "type": "uint256"},
      {"name": "lobbyId", "type": "string"},
      {"name": "stakeAmount", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "gameId", "type": "bytes32"},
      {"name": "playerIndex", "type": "uint256"}
    ],
    "name": "getPlayer",
    "outputs": [
      {"name": "wallet", "type": "address"},
      {"name": "role", "type": "uint8"},
      {"name": "isAlive", "type": "bool"},
      {"name": "hasVoted", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "gameId", "type": "bytes32"},
      {"name": "playerAddr", "type": "address"}
    ],
    "name": "getPlayerRole",
    "outputs": [{"name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "gameId", "type": "bytes32"}],
    "name": "getVoteResults",
    "outputs": [{"name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "gameId", "type": "bytes32"},
      {"indexed": true, "name": "host", "type": "address"},
      {"indexed": false, "name": "lobbyId", "type": "string"}
    ],
    "name": "GameCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "gameId", "type": "bytes32"},
      {"indexed": true, "name": "player", "type": "address"},
      {"indexed": false, "name": "playerIndex", "type": "uint256"}
    ],
    "name": "PlayerJoined",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "gameId", "type": "bytes32"},
      {"indexed": false, "name": "imposterIndex", "type": "uint256"}
    ],
    "name": "GameStarted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "gameId", "type": "bytes32"},
      {"indexed": true, "name": "imposter", "type": "address"},
      {"indexed": false, "name": "amount", "type": "uint256"}
    ],
    "name": "GameRugged",
    "type": "event"
  }
] as const;

// Contract address for Base Sepolia testnet
export const SUS_GAME_CONTRACT_ADDRESS = "0x45D8421807A9C88dac321aE0245540dA579d5703" as Address;

// Constants
export const ENTRY_FEE = "0.0001"; // 0.0001 ETH (reduced for testnet)
export const VOTE_DURATION = 30; // 30 seconds

// Enums
export enum GameState {
  LOBBY = 0,
  PLAYING = 1,
  VOTING = 2,
  ENDED = 3
}

export enum Role {
  CREW = 0,
  IMPOSTER = 1
}

// Types
export interface GameData {
  host: Address;
  state: GameState;
  pot: bigint;
  playerCount: number;
  lobbyId: string;
}

export interface PlayerData {
  wallet: Address;
  role: Role;
  isAlive: boolean;
  hasVoted: boolean;
}