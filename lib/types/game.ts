export type GamePhase = 'lobby' | 'reveal' | 'discussion' | 'voting' | 'ended';

export type Role = 'crew' | 'traitor' | null;

export interface Player {
  id: string;
  address: string;
  name?: string;
  avatar?: string;
  isEliminated: boolean;
  isReady: boolean;
  joinedAt: Date;
}

export interface Message {
  id: string;
  playerId: string;
  playerName: string;
  content: string;
  timestamp: Date;
  type: 'chat' | 'system' | 'elimination' | 'victory';
}

export interface Vote {
  voterId: string;
  targetId: string;
  timestamp: Date;
}

export interface GameState {
  gameId: string | null;
  lobbyId: string | null;
  stakeAmount: bigint;
  potSize: bigint;
  maxPlayers: number;
  
  // Game flow
  phase: GamePhase;
  timeRemaining: number;
  currentRound: number;
  
  // Players
  players: Player[];
  myPlayerId: string | null;
  myRole: Role;
  isHost: boolean;
  isEliminated: boolean;
  
  // Chat
  messages: Message[];
  unreadCount: number;
  
  // Voting
  votes: Vote[];
  votingTarget: string | null;
  hasVoted: boolean;
  
  // Game results
  winners: string[];
  isGameEnded: boolean;
  ruggedBy: string | null;
}

export interface GameActions {
  // Game management
  createGame: (stakeAmount: bigint, maxPlayers: number) => Promise<void>;
  joinGame: (lobbyId: string) => Promise<void>;
  leaveGame: () => void;
  startGame: () => Promise<void>;
  
  // Game flow
  setPhase: (phase: GamePhase) => void;
  setTimeRemaining: (time: number) => void;
  nextRound: () => void;
  
  // Player management
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  setPlayerReady: (playerId: string, ready: boolean) => void;
  setMyRole: (role: Role) => void;
  eliminatePlayer: (playerId: string) => void;
  
  // Chat
  sendMessage: (content: string) => void;
  addMessage: (message: Message) => void;
  clearUnread: () => void;
  
  // Voting
  castVote: (targetId: string) => void;
  clearVotes: () => void;
  setVotingTarget: (targetId: string | null) => void;
  
  // Game ending
  endGame: (winners: string[], ruggedBy?: string) => void;
  rugPot: () => Promise<void>;
  
  // Reset
  resetGame: () => void;
}

export interface ChatState {
  messages: Message[];
  unreadCount: number;
  isTyping: { [playerId: string]: boolean };
}

export interface ChatActions {
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  markAsRead: () => void;
  setTyping: (playerId: string, typing: boolean) => void;
}

export interface SocketState {
  isConnected: boolean;
  connectionError: string | null;
  lastReconnectAttempt: Date | null;
}

export interface SocketActions {
  connect: (gameId: string) => void;
  disconnect: () => void;
  setConnectionStatus: (connected: boolean, error?: string) => void;
}

export type GameStore = GameState & GameActions;
export type ChatStore = ChatState & ChatActions;
export type SocketStore = SocketState & SocketActions;