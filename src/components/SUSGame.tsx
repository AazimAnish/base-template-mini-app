"use client";

import { useState, useEffect, useMemo } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther } from "viem";

import { Landing } from "./Landing";
import { Lobby } from "./Lobby";
import { Playground } from "./Playground";
import { Vote } from "./Vote";
import { GameEnd } from "./GameEnd";

import { 
  SUS_GAME_ABI, 
  SUS_GAME_CONTRACT_ADDRESS, 
  GameState, 
  Role
} from "~/lib/susContract";

type Screen = "landing" | "lobby" | "playground" | "vote" | "gameEnd";

interface GameInfo {
  gameId: string;
  isHost: boolean;
  players: Array<{
    address: string;
    index: number;
    isAlive: boolean;
  }>;
  userRole?: "CREW" | "IMPOSTER";
  pot: string;
  state: GameState;
  hasStaked: boolean;
  hasVoted: boolean;
  votedFor?: number;
  voteTimeLeft: number;
  stakeAmount?: string;
}

export default function SUSGame() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("landing");
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStaking, setIsStaking] = useState(false);
  const [isCreatingLobby, setIsCreatingLobby] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [pendingGameId, setPendingGameId] = useState<string | null>(null);

  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Handle wallet disconnection
  useEffect(() => {
    if (!isConnected && gameInfo) {
      // Reset game state when wallet is disconnected
      setGameInfo(null);
      setCurrentScreen("landing");
      setError(null);
    }
  }, [isConnected, gameInfo]);

  // Read game state with polling
  const { data: gameStateData } = useReadContract({
    address: SUS_GAME_CONTRACT_ADDRESS,
    abi: SUS_GAME_ABI,
    functionName: "getGameState",
    args: gameInfo?.gameId ? [gameInfo.gameId as `0x${string}`] : undefined,
    query: { 
      enabled: !!gameInfo?.gameId,
      refetchInterval: 3000 // Poll every 3 seconds
    }
  });

  // Read user role if in game
  const { data: userRoleData } = useReadContract({
    address: SUS_GAME_CONTRACT_ADDRESS,
    abi: SUS_GAME_ABI,
    functionName: "getPlayerRole",
    args: gameInfo?.gameId && address ? [gameInfo.gameId as `0x${string}`, address] : undefined,
    query: { enabled: !!(gameInfo?.gameId && address) }
  });


  // Fetch first 10 possible players - we'll filter out empty ones
  const playerQueries = Array.from({ length: 10 }, (_, i) => 
    useReadContract({
      address: SUS_GAME_CONTRACT_ADDRESS,
      abi: SUS_GAME_ABI,
      functionName: "getPlayer",
      args: gameInfo?.gameId ? [gameInfo.gameId as `0x${string}`, BigInt(i)] : undefined,
      query: { 
        enabled: !!(gameInfo?.gameId),
        refetchInterval: 3000
      }
    })
  );

  // Process player data from contract queries
  const processedPlayers = useMemo(() => {
    return playerQueries
      .map((query, index) => {
        if (query.data && query.data[0] !== '0x0000000000000000000000000000000000000000') {
          const [wallet] = query.data;
          return {
            address: wallet as string,
            index: index + 1,
            isAlive: true
          };
        }
        return null;
      })
      .filter((player): player is { address: string; index: number; isAlive: boolean } => player !== null);
  }, [playerQueries.map(q => q.data).join(',')]);  // Only depend on actual data changes

  useEffect(() => {
    if (gameStateData) {
      const [host, state, pot, playerCount, , stakeAmount] = gameStateData;
      
      // Update game info with latest state and real player data
      setGameInfo(prev => {
        if (!prev) return null;
        
        const newPot = formatEther(pot);
        const newStakeAmount = formatEther(stakeAmount);
        const newState = state as GameState;
        
        // Check if current user has staked (is in the player list)
        const userHasStaked = processedPlayers.some(p => p && p.address.toLowerCase() === address?.toLowerCase());
        
        // Only update if values actually changed
        if (prev.pot === newPot && 
            prev.stakeAmount === newStakeAmount && 
            prev.state === newState && 
            prev.players.length === processedPlayers.length &&
            prev.hasStaked === userHasStaked) {
          return prev; // No changes, return same object
        }
        
        return {
          ...prev,
          state: newState,
          pot: newPot,
          stakeAmount: newStakeAmount,
          players: processedPlayers.length > 0 ? processedPlayers : prev.players,
          hasStaked: userHasStaked,
          isHost: host.toLowerCase() === address?.toLowerCase()
        };
      });

      // Navigate based on game state
      if (state === GameState.PLAYING && currentScreen !== "playground") {
        setCurrentScreen("playground");
      } else if (state === GameState.VOTING && currentScreen !== "vote") {
        setCurrentScreen("vote");
      } else if (state === GameState.ENDED && currentScreen !== "gameEnd") {
        setCurrentScreen("gameEnd");
      }
    }
  }, [gameStateData, currentScreen, address, processedPlayers]);

  useEffect(() => {
    if (userRoleData !== undefined) {
      setGameInfo(prev => prev ? {
        ...prev,
        userRole: userRoleData === Role.IMPOSTER ? "IMPOSTER" : "CREW"
      } : null);
    }
  }, [userRoleData]);

  const handleCreateLobby = async (stakeAmount: string) => {
    if (!address) return;
    
    setIsCreatingLobby(true);
    try {
      // Generate a simple lobby ID - the contract will generate the actual gameId
      const timestamp = Date.now();
      const lobbyId = `lobby_${timestamp}`;
      const stakeAmountWei = parseEther(stakeAmount);
      
      console.log("Creating lobby with:", { lobbyId, stakeAmount });
      
      // Call createGame with lobbyId - contract will return the actual gameId
      await writeContract({
        address: SUS_GAME_CONTRACT_ADDRESS,
        abi: SUS_GAME_ABI,
        functionName: "createGame",
        args: [lobbyId, stakeAmountWei], // lobbyId first, then stake amount
      });

      console.log("Create lobby transaction submitted");
      
      // Generate a bytes32 gameId from the lobbyId for testing
      // In production, you'd use the actual returned gameId from the transaction
      const encoder = new TextEncoder();
      const lobbyBytes = encoder.encode(lobbyId.padEnd(32, '0'));
      const gameIdBytes32 = `0x${Array.from(lobbyBytes).map(b => b.toString(16).padStart(2, '0')).join('').padEnd(64, '0')}`;
      
      setGameInfo({
        gameId: gameIdBytes32,
        isHost: true,
        players: [], // Start with empty - host needs to stake to join
        pot: "0",
        state: GameState.LOBBY,
        hasStaked: false, // Host needs to stake too
        hasVoted: false,
        voteTimeLeft: 0,
        stakeAmount
      });
      
      // Save the mapping for other players to use
      const savedGameIds = JSON.parse(localStorage.getItem('susGameIds') || '{}');
      savedGameIds[lobbyId] = gameIdBytes32;
      localStorage.setItem('susGameIds', JSON.stringify(savedGameIds));
      
      console.log("Created game mapping:", { lobbyId, gameId: gameIdBytes32 });
      
      setCurrentScreen("lobby");
      
      // Store the lobbyId for sharing
      console.log("Share this lobby ID with other players:", lobbyId);
      
    } catch (err) {
      console.error("Failed to create lobby:", err);
      setError("Failed to create lobby. Make sure you have enough ETH for gas fees.");
    } finally {
      setIsCreatingLobby(false);
    }
  };


  const handleJoinLobby = async (lobbyId: string) => {
    if (!address) return;
    
    try {
      console.log("Attempting to join lobby:", lobbyId);
      
      // Look up the actual gameId for this lobbyId
      const savedGameIds = JSON.parse(localStorage.getItem('susGameIds') || '{}');
      const gameId = savedGameIds[lobbyId];
      
      if (!gameId) {
        throw new Error(`Game not found for lobby ID: ${lobbyId}. Make sure the lobby exists.`);
      }
      
      console.log("Joining game:", { lobbyId, gameId });
      
      // Set initial state
      setGameInfo({
        gameId,
        isHost: false,
        players: [],
        pot: "0",
        state: GameState.LOBBY,
        hasStaked: false,
        hasVoted: false,
        voteTimeLeft: 0
      });
      
      setCurrentScreen("lobby");
      
    } catch (err) {
      console.error("Failed to join lobby:", err);
      setError("Failed to join lobby. Make sure the lobby ID is correct.");
    }
  };

  const handleStake = async () => {
    if (!gameInfo || !gameInfo.stakeAmount || !address) {
      console.error("Missing required data for staking:", { gameInfo: !!gameInfo, stakeAmount: gameInfo?.stakeAmount, address });
      return;
    }
    
    setIsStaking(true);
    try {
      // Use the gameId from gameInfo directly
      const actualGameId = gameInfo.gameId;
      console.log("Using gameId for staking:", actualGameId);
      
      console.log("Attempting to stake:", {
        originalId: gameInfo.gameId,
        actualGameId,
        stakeAmount: gameInfo.stakeAmount,
        stakeAmountWei: parseEther(gameInfo.stakeAmount).toString(),
        address
      });
      
      await writeContract({
        address: SUS_GAME_CONTRACT_ADDRESS,
        abi: SUS_GAME_ABI,
        functionName: "joinGame", 
        args: [actualGameId as `0x${string}`],
        value: parseEther(gameInfo.stakeAmount),
      });

      console.log("Stake transaction submitted");

      // Update gameInfo with the actual gameId if it was resolved
      if (actualGameId !== gameInfo.gameId) {
        setGameInfo(prev => prev ? { ...prev, gameId: actualGameId } : null);
      }
      
      console.log("Waiting for transaction confirmation...");
    } catch (err) {
      console.error("Failed to stake:", err);
      setError(`Failed to stake. ${err instanceof Error ? err.message : 'Make sure you have enough ETH for the stake amount and gas fees.'}`); 
      throw err; // Re-throw so the UI can handle it
    } finally {
      setIsStaking(false);
    }
  };

  const handleStartGame = async () => {
    if (!gameInfo) return;
    
    setIsStartingGame(true);
    try {
      await writeContract({
        address: SUS_GAME_CONTRACT_ADDRESS,
        abi: SUS_GAME_ABI,
        functionName: "startGame",
        args: [gameInfo.gameId as `0x${string}`],
      });
      
      console.log("Start game transaction submitted");
      // State will be updated by contract reading
      // The useEffect will handle screen transition
    } catch (err) {
      console.error("Failed to start game:", err);
      setError("Failed to start game. Make sure you have enough players (minimum 3).");
    } finally {
      setIsStartingGame(false);
    }
  };

  const handleRug = async () => {
    if (!gameInfo) return;
    
    try {
      await writeContract({
        address: SUS_GAME_CONTRACT_ADDRESS,
        abi: SUS_GAME_ABI,
        functionName: "rug",
        args: [gameInfo.gameId as `0x${string}`],
      });
      
      // Game end state will be updated by contract reading
    } catch (err) {
      console.error("Failed to rug:", err);
      setError("Failed to rug. Only the imposter can perform this action.");
    }
  };

  const handleStartVote = async () => {
    if (!gameInfo) return;
    
    try {
      await writeContract({
        address: SUS_GAME_CONTRACT_ADDRESS,
        abi: SUS_GAME_ABI,
        functionName: "startVote",
        args: [gameInfo.gameId as `0x${string}`],
      });
      
      // Voting state will be updated by contract reading
      setGameInfo(prev => prev ? { ...prev, voteTimeLeft: 30 } : null);
      setCurrentScreen("vote");
    } catch (err) {
      console.error("Failed to start vote:", err);
      setError("Failed to start vote.");
    }
  };

  const handleVote = async (playerIndex: number) => {
    if (!gameInfo) return;
    
    try {
      await writeContract({
        address: SUS_GAME_CONTRACT_ADDRESS,
        abi: SUS_GAME_ABI,
        functionName: "vote",
        args: [gameInfo.gameId as `0x${string}`, BigInt(playerIndex)],
      });
      
      setGameInfo(prev => prev ? {
        ...prev,
        hasVoted: true,
        votedFor: playerIndex
      } : null);
    } catch (err) {
      console.error("Failed to vote:", err);
      setError("Failed to vote. Make sure you haven't already voted.");
    }
  };

  const handleShareResult = () => {
    // Implement Farcaster sharing
    const text = gameInfo?.userRole === "IMPOSTER" 
      ? "I was the imposter in SUS! 😈" 
      : "I played SUS and survived! 🚀";
    
    const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(window.location.origin)}`;
    window.open(url, "_blank");
  };

  const handleBackToHome = () => {
    setGameInfo(null);
    setCurrentScreen("landing");
    setError(null);
  };

  const handlePlayAgain = () => {
    setGameInfo(null);
    setCurrentScreen("landing");
    setError(null);
  };

  const handleBack = () => {
    if (currentScreen === "lobby") {
      setCurrentScreen("landing");
      setGameInfo(null);
    } else if (currentScreen === "vote") {
      setCurrentScreen("playground");
    } else {
      setCurrentScreen("landing");
      setGameInfo(null);
    }
  };

  // Error display
  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render screens
  switch (currentScreen) {
    case "landing":
      return (
        <Landing
          onCreateLobby={handleCreateLobby}
          onJoinLobby={handleJoinLobby}
          isCreatingLobby={isCreatingLobby}
        />
      );
      
    case "lobby":
      return gameInfo ? (
        <Lobby
          gameId={gameInfo.gameId}
          isHost={gameInfo.isHost}
          players={gameInfo.players}
          pot={gameInfo.pot}
          stakeAmount={gameInfo.stakeAmount}
          onStartGame={handleStartGame}
          onStake={handleStake}
          hasStaked={gameInfo.hasStaked}
          onBack={handleBack}
          isStaking={isStaking}
          isStartingGame={isStartingGame}
        />
      ) : null;
      
    case "playground":
      return gameInfo ? (
        <Playground
          gameId={gameInfo.gameId}
          players={gameInfo.players}
          userRole={gameInfo.userRole!}
          pot={gameInfo.pot}
          onRug={handleRug}
          onStartVote={handleStartVote}
          onBack={handleBack}
        />
      ) : null;
      
    case "vote":
      return gameInfo ? (
        <Vote
          gameId={gameInfo.gameId}
          players={gameInfo.players}
          timeLeft={gameInfo.voteTimeLeft}
          onVote={handleVote}
          onBack={handleBack}
          hasVoted={gameInfo.hasVoted}
          votedFor={gameInfo.votedFor}
        />
      ) : null;
      
    case "gameEnd":
      return gameInfo ? (
        <GameEnd
          gameResult={gameInfo.userRole === "IMPOSTER" ? "IMPOSTER_WIN" : "CREW_WIN"}
          userRole={gameInfo.userRole!}
          isWinner={true}
          winnings={gameInfo.pot}
          players={gameInfo.players.map(p => ({
            ...p,
            role: p.address === address ? gameInfo.userRole! : "CREW",
            isWinner: true
          }))}
          onPlayAgain={handlePlayAgain}
          onShareResult={handleShareResult}
          onBackToHome={handleBackToHome}
        />
      ) : null;
      
    default:
      return <Landing onCreateLobby={handleCreateLobby} onJoinLobby={handleJoinLobby} />;
  }
}