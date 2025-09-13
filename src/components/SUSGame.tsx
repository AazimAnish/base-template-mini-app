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
  const [demoMode, setDemoMode] = useState(true); // Demo mode - no real transactions
  
  const toggleDemoMode = () => {
    setDemoMode(prev => !prev);
    // Reset game state when switching modes
    setGameInfo(null);
    setCurrentScreen("landing");
    setError(null);
  };
  const [demoStep, setDemoStep] = useState(0);

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

  // Demo mode navigation effect - handles screen transitions when not using contract
  useEffect(() => {
    if (demoMode && gameInfo) {
      // Navigate based on game state in demo mode
      if (gameInfo.state === GameState.PLAYING && currentScreen !== "playground") {
        setCurrentScreen("playground");
      } else if (gameInfo.state === GameState.VOTING && currentScreen !== "vote") {
        setCurrentScreen("vote");
      } else if (gameInfo.state === GameState.ENDED && currentScreen !== "gameEnd") {
        setCurrentScreen("gameEnd");
      }
    }
  }, [demoMode, gameInfo?.state, currentScreen]);

  useEffect(() => {
    if (userRoleData !== undefined) {
      setGameInfo(prev => prev ? {
        ...prev,
        userRole: userRoleData === Role.IMPOSTER ? "IMPOSTER" : "CREW"
      } : null);
    }
  }, [userRoleData]);

  const handleCreateLobby = async (stakeAmount: string) => {
    if (demoMode) {
      // Demo Mode - No real transactions
      setIsCreatingLobby(true);
      
      // Simulate loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const timestamp = Date.now();
      const lobbyId = `demo_${timestamp}`;
      
      setGameInfo({
        gameId: lobbyId,
        isHost: true,
        players: [
          { address: "0x1234...5678 (You)", index: 1, isAlive: true },
          { address: "0xabcd...ef01", index: 2, isAlive: true },
          { address: "0x9876...5432", index: 3, isAlive: true }
        ],
        pot: (parseFloat(stakeAmount) * 3).toString(),
        state: GameState.PLAYING,
        hasStaked: true,
        hasVoted: false,
        voteTimeLeft: 0,
        stakeAmount,
        userRole: Math.random() > 0.5 ? "IMPOSTER" : "CREW"
      });
      
      setCurrentScreen("playground");
      setIsCreatingLobby(false);
      
      // Auto-start vote after 5 seconds
      setTimeout(() => {
        setGameInfo(prev => prev ? {
          ...prev,
          state: GameState.VOTING,
          voteTimeLeft: 30
        } : null);
        
        // Start countdown
        const countdown = setInterval(() => {
          setGameInfo(prev => {
            if (!prev || prev.voteTimeLeft <= 1) {
              clearInterval(countdown);
              // Auto-end voting when time runs out
              if (prev && prev.voteTimeLeft <= 1) {
                return { ...prev, state: GameState.ENDED };
              }
              return prev;
            }
            return { ...prev, voteTimeLeft: prev.voteTimeLeft - 1 };
          });
        }, 1000);
      }, 5000);
      
      return;
    }
    
    // Original wallet-based logic (kept for production use)
    if (!address) return;
    
    setIsCreatingLobby(true);
    try {
      const timestamp = Date.now();
      const lobbyId = `lobby_${timestamp}`;
      const stakeAmountWei = parseEther(stakeAmount);
      
      console.log("Creating lobby with:", { lobbyId, stakeAmount });
      
      await writeContract({
        address: SUS_GAME_CONTRACT_ADDRESS,
        abi: SUS_GAME_ABI,
        functionName: "createGame",
        args: [lobbyId, stakeAmountWei],
      });

      const encoder = new TextEncoder();
      const lobbyBytes = encoder.encode(lobbyId.padEnd(32, '0'));
      const gameIdBytes32 = `0x${Array.from(lobbyBytes).map(b => b.toString(16).padStart(2, '0')).join('').padEnd(64, '0')}`;
      
      setGameInfo({
        gameId: gameIdBytes32,
        isHost: true,
        players: [],
        pot: "0",
        state: GameState.LOBBY,
        hasStaked: false,
        hasVoted: false,
        voteTimeLeft: 0,
        stakeAmount
      });
      
      const savedGameIds = JSON.parse(localStorage.getItem('susGameIds') || '{}');
      savedGameIds[lobbyId] = gameIdBytes32;
      localStorage.setItem('susGameIds', JSON.stringify(savedGameIds));
      
      setCurrentScreen("lobby");
      
    } catch (err) {
      console.error("Failed to create lobby:", err);
      setError("Failed to create lobby. Make sure you have enough ETH for gas fees.");
    } finally {
      setIsCreatingLobby(false);
    }
  };


  const handleJoinLobby = async (lobbyId: string) => {
    if (demoMode) {
      // Demo Mode - Skip directly to playground with mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setGameInfo({
        gameId: lobbyId,
        isHost: false,
        players: [
          { address: "0x9999...1111 (Host)", index: 1, isAlive: true },
          { address: "0xabcd...ef01", index: 2, isAlive: true },
          { address: "0x1234...5678 (You)", index: 3, isAlive: true }
        ],
        pot: "0.0003", // 3 players × 0.0001 ETH
        state: GameState.PLAYING,
        hasStaked: true,
        hasVoted: false,
        voteTimeLeft: 0,
        stakeAmount: "0.0001",
        userRole: Math.random() > 0.5 ? "IMPOSTER" : "CREW"
      });
      
      setCurrentScreen("playground");
      
      // Auto-start vote after 5 seconds
      setTimeout(() => {
        setGameInfo(prev => prev ? {
          ...prev,
          state: GameState.VOTING,
          voteTimeLeft: 30
        } : null);
        
        // Start countdown
        const countdown = setInterval(() => {
          setGameInfo(prev => {
            if (!prev || prev.voteTimeLeft <= 1) {
              clearInterval(countdown);
              // Auto-end voting when time runs out
              if (prev && prev.voteTimeLeft <= 1) {
                return { ...prev, state: GameState.ENDED };
              }
              return prev;
            }
            return { ...prev, voteTimeLeft: prev.voteTimeLeft - 1 };
          });
        }, 1000);
      }, 5000);
      
      return;
    }
    
    // Original wallet-based logic
    if (!address) return;
    
    try {
      console.log("Attempting to join lobby:", lobbyId);
      
      const savedGameIds = JSON.parse(localStorage.getItem('susGameIds') || '{}');
      const gameId = savedGameIds[lobbyId];
      
      if (!gameId) {
        throw new Error(`Game not found for lobby ID: ${lobbyId}. Make sure the lobby exists.`);
      }
      
      console.log("Joining game:", { lobbyId, gameId });
      
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
    if (demoMode) {
      // Demo Mode - Just update state
      setIsStaking(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setGameInfo(prev => prev ? {
        ...prev,
        hasStaked: true
      } : null);
      
      setIsStaking(false);
      return;
    }
    
    // Original wallet-based logic
    if (!gameInfo || !gameInfo.stakeAmount || !address) {
      console.error("Missing required data for staking:", { gameInfo: !!gameInfo, stakeAmount: gameInfo?.stakeAmount, address });
      return;
    }
    
    setIsStaking(true);
    try {
      const actualGameId = gameInfo.gameId;
      console.log("Using gameId for staking:", actualGameId);
      
      await writeContract({
        address: SUS_GAME_CONTRACT_ADDRESS,
        abi: SUS_GAME_ABI,
        functionName: "joinGame", 
        args: [actualGameId as `0x${string}`],
        value: parseEther(gameInfo.stakeAmount),
      });

      console.log("Stake transaction submitted");
      console.log("Waiting for transaction confirmation...");
    } catch (err) {
      console.error("Failed to stake:", err);
      setError(`Failed to stake. ${err instanceof Error ? err.message : 'Make sure you have enough ETH for the stake amount and gas fees.'}`); 
      throw err;
    } finally {
      setIsStaking(false);
    }
  };

  const handleStartGame = async () => {
    if (!gameInfo) return;
    
    if (demoMode) {
      // Demo Mode - Start game and assign roles
      setIsStartingGame(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setGameInfo(prev => prev ? {
        ...prev,
        state: GameState.PLAYING,
        userRole: Math.random() > 0.5 ? "IMPOSTER" : "CREW" // Random role for demo
      } : null);
      
      setCurrentScreen("playground");
      setIsStartingGame(false);
      return;
    }
    
    // Original wallet-based logic
    setIsStartingGame(true);
    try {
      await writeContract({
        address: SUS_GAME_CONTRACT_ADDRESS,
        abi: SUS_GAME_ABI,
        functionName: "startGame",
        args: [gameInfo.gameId as `0x${string}`],
      });
      
      console.log("Start game transaction submitted");
    } catch (err) {
      console.error("Failed to start game:", err);
      setError("Failed to start game. Make sure you have enough players (minimum 3).");
    } finally {
      setIsStartingGame(false);
    }
  };

  const handleRug = async () => {
    if (!gameInfo) return;
    
    if (demoMode) {
      // Demo Mode - Imposter wins
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setGameInfo(prev => prev ? {
        ...prev,
        state: GameState.ENDED
      } : null);
      
      setCurrentScreen("gameEnd");
      return;
    }
    
    // Original wallet-based logic
    try {
      await writeContract({
        address: SUS_GAME_CONTRACT_ADDRESS,
        abi: SUS_GAME_ABI,
        functionName: "rug",
        args: [gameInfo.gameId as `0x${string}`],
      });
    } catch (err) {
      console.error("Failed to rug:", err);
      setError("Failed to rug. Only the imposter can perform this action.");
    }
  };

  const handleStartVote = async () => {
    if (!gameInfo) return;
    
    if (demoMode) {
      // Demo Mode - Start voting
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setGameInfo(prev => prev ? {
        ...prev,
        state: GameState.VOTING,
        voteTimeLeft: 30
      } : null);
      
      setCurrentScreen("vote");
      
      // Start countdown
      const countdown = setInterval(() => {
        setGameInfo(prev => {
          if (!prev || prev.voteTimeLeft <= 1) {
            clearInterval(countdown);
            // Auto-end voting when time runs out
            if (prev && prev.voteTimeLeft <= 1) {
              return { ...prev, state: GameState.ENDED };
            }
            return prev;
          }
          return { ...prev, voteTimeLeft: prev.voteTimeLeft - 1 };
        });
      }, 1000);
      
      return;
    }
    
    // Original wallet-based logic
    try {
      await writeContract({
        address: SUS_GAME_CONTRACT_ADDRESS,
        abi: SUS_GAME_ABI,
        functionName: "startVote",
        args: [gameInfo.gameId as `0x${string}`],
      });
      
      setGameInfo(prev => prev ? { ...prev, voteTimeLeft: 30 } : null);
      setCurrentScreen("vote");
    } catch (err) {
      console.error("Failed to start vote:", err);
      setError("Failed to start vote.");
    }
  };

  const handleVote = async (playerIndex: number) => {
    if (!gameInfo) return;
    
    if (demoMode) {
      // Demo Mode - Cast vote and end game
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setGameInfo(prev => prev ? {
        ...prev,
        hasVoted: true,
        votedFor: playerIndex,
        state: GameState.ENDED
      } : null);
      
      // Go to game end after short delay
      setTimeout(() => {
        setCurrentScreen("gameEnd");
      }, 1500);
      
      return;
    }
    
    // Original wallet-based logic
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
          demoMode={demoMode}
          onToggleDemoMode={toggleDemoMode}
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