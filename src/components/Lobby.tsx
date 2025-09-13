"use client";

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/Dialog";
import { useAccount } from "wagmi";

interface Player {
  address: string;
  index: number;
}

interface LobbyProps {
  gameId: string;
  isHost: boolean;
  players: Player[];
  pot: string;
  stakeAmount?: string;
  onStartGame: () => void;
  onStake: () => void;
  hasStaked: boolean;
  onBack: () => void;
  isLoading?: boolean;
  isStaking?: boolean;
  isStartingGame?: boolean;
}

export function Lobby({ 
  gameId, 
  isHost, 
  players, 
  pot, 
  stakeAmount,
  onStartGame, 
  onStake, 
  hasStaked,
  onBack,
  isLoading = false,
  isStaking = false,
  isStartingGame = false
}: LobbyProps) {
  const [showStakeDialog, setShowStakeDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const { address } = useAccount();

  const copyLobbyId = async () => {
    let lobbyIdToCopy;
    if (gameId.startsWith('demo_')) {
      lobbyIdToCopy = gameId; // Use demo ID directly
    } else {
      const savedGameIds = JSON.parse(localStorage.getItem('susGameIds') || '{}');
      lobbyIdToCopy = Object.keys(savedGameIds).find(key => savedGameIds[key] === gameId) || gameId;
    }
    
    await navigator.clipboard.writeText(lobbyIdToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStake = async () => {
    try {
      await onStake();
      setShowStakeDialog(false);
    } catch (err) {
      console.error("Staking failed:", err);
    }
  };

  const canStartGame = players.length >= 3 && isHost;
  
  // Get the original lobbyId for display
  let originalLobbyId;
  if (gameId.startsWith('demo_')) {
    originalLobbyId = gameId; // Use demo ID directly
  } else {
    const savedGameIds = JSON.parse(localStorage.getItem('susGameIds') || '{}');
    originalLobbyId = Object.keys(savedGameIds).find(key => savedGameIds[key] === gameId) || gameId;
  }
  
  const shortLobbyId = originalLobbyId.length > 16 
    ? originalLobbyId.slice(0, 8) + '...' + originalLobbyId.slice(-6)
    : originalLobbyId;

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-500 mb-4">SUS</h1>
          <h2 className="text-xl font-semibold">Lobby</h2>
        </div>

        {/* Lobby Info Card */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-center">
              Pot Size: {pot} ETH
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Lobby ID */}
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-2">Lobby ID</p>
              <div 
                onClick={copyLobbyId}
                className="bg-gray-800 p-3 rounded cursor-pointer hover:bg-gray-700 transition-colors"
              >
                <p className="font-mono text-sm">{shortLobbyId}</p>
                {copied && <p className="text-xs text-green-400 mt-1">Copied!</p>}
              </div>
              <p className="text-xs text-gray-500 mt-1">Click to copy</p>
            </div>

            {/* Players List */}
            <div>
              <p className="text-sm text-gray-400 mb-3">
                Players ({players.length}/10)
              </p>
              <div className="space-y-2">
                {players.map((player, index) => (
                  <div 
                    key={player.address} 
                    className="flex items-center justify-between bg-gray-800 p-3 rounded"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold">{index + 1}</span>
                      </div>
                      <span className="font-mono text-sm">
                        {player.address.slice(0, 6)}...{player.address.slice(-4)}
                      </span>
                    </div>
                    {player.address === address && (
                      <span className="text-xs text-green-400">You</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          {isHost ? (
            <Button 
              onClick={onStartGame}
              disabled={!canStartGame || isStartingGame}
              className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700"
            >
              {isStartingGame ? "Starting Game..." : canStartGame ? "Start Game" : `Need ${3 - players.length} more players`}
            </Button>
          ) : (
            <>
              {!hasStaked ? (
                <Dialog open={showStakeDialog} onOpenChange={setShowStakeDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      disabled={isStaking}
                      className="w-full h-12 text-lg bg-green-600 hover:bg-green-700 disabled:bg-gray-700"
                    >
                      {isStaking ? "Processing..." : `Stake (${stakeAmount || "0.0001"} ETH)`}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-900 border-gray-700 text-white">
                    <DialogHeader>
                      <DialogTitle>Confirm Stake</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <p className="text-sm text-gray-300">
                        You are about to stake {stakeAmount || "0.0001"} ETH to join this game.
                      </p>
                      <p className="text-xs text-gray-400">
                        • If crew wins: Share the pot with other crew members
                      </p>
                      <p className="text-xs text-gray-400">
                        • If imposter wins: Lose your stake
                      </p>
                      <Button 
                        onClick={handleStake}
                        disabled={isStaking}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {isStaking ? "Staking..." : "Confirm Stake"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <div className="text-center p-4 bg-green-900/30 rounded-lg border border-green-700">
                  <p className="text-green-400">✓ Staked! Waiting for game to start...</p>
                </div>
              )}
            </>
          )}

          <Button 
            onClick={onBack}
            variant="outline" 
            className="w-full h-12 text-lg border-gray-600 text-white hover:bg-gray-800"
          >
            Back
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>• Share the Lobby ID with friends to invite them</p>
          <p>• Minimum 3 players required to start</p>
          <p>• Maximum 10 players per game</p>
          {gameId.startsWith('demo_') && (
            <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
              <p className="text-blue-400 text-sm font-semibold">🎮 Demo Mode</p>
              <p className="text-blue-300 text-xs mt-1">
                Game will auto-progress through all screens to show the full experience!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}