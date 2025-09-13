"use client";

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { RadioGroup, RadioGroupItem } from "~/components/ui/RadioGroup";
import { Label } from "~/components/ui/label";
import { useAccount } from "wagmi";

interface Player {
  address: string;
  index: number;
  isAlive: boolean;
}

interface VoteProps {
  gameId: string;
  players: Player[];
  timeLeft: number;
  onVote: (playerIndex: number) => void;
  onBack: () => void;
  hasVoted: boolean;
  votedFor?: number;
}

export function Vote({ 
  gameId, 
  players, 
  timeLeft, 
  onVote, 
  onBack,
  hasVoted,
  votedFor
}: VoteProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const { address } = useAccount();

  const alivePlayers = players.filter(p => p.isAlive);

  const handleVote = () => {
    if (selectedPlayer) {
      const playerIndex = parseInt(selectedPlayer);
      onVote(playerIndex);
    }
  };

  const formatTime = (seconds: number) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const isTimeUp = timeLeft <= 0;
  const canVote = !hasVoted && selectedPlayer && !isTimeUp;

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-500 mb-2">SUS</h1>
          <h2 className="text-xl font-semibold">Emergency Meeting</h2>
        </div>

        {/* Timer */}
        <Card className={`border-2 ${
          timeLeft <= 10 ? "border-red-500 bg-red-900/20" : "border-yellow-500 bg-yellow-900/20"
        }`}>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className={`text-4xl font-bold ${
                timeLeft <= 10 ? "text-red-400" : "text-yellow-400"
              }`}>
                {formatTime(timeLeft)}
              </div>
              <p className="text-sm text-gray-400 mt-2">
                {isTimeUp ? "Voting ended!" : "Time left to vote"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Voting Status */}
        {hasVoted && votedFor && (
          <Card className="bg-green-900/30 border-green-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-green-400 font-semibold">✓ Vote Submitted</p>
                <p className="text-sm text-gray-400 mt-1">
                  You voted for: {alivePlayers.find(p => p.index === votedFor)?.address.slice(0, 6)}...{alivePlayers.find(p => p.index === votedFor)?.address.slice(-4)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Player Selection */}
        {!hasVoted && !isTimeUp && (
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Who is the imposter?</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedPlayer} onValueChange={setSelectedPlayer}>
                {alivePlayers.map((player) => (
                  <div key={player.address} className="flex items-center space-x-2 p-3 bg-gray-800 rounded hover:bg-gray-700">
                    <RadioGroupItem 
                      value={player.index.toString()} 
                      id={player.index.toString()}
                    />
                    <Label 
                      htmlFor={player.index.toString()} 
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm">
                          {player.address.slice(0, 6)}...{player.address.slice(-4)}
                        </span>
                        {player.address === address && (
                          <span className="text-xs text-blue-400">You</span>
                        )}
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        )}

        {/* Players List (when voting ended or already voted) */}
        {(hasVoted || isTimeUp) && (
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Players ({alivePlayers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alivePlayers.map((player) => (
                  <div key={player.address} className="flex items-center justify-between bg-gray-800 p-3 rounded">
                    <span className="font-mono text-sm">
                      {player.address.slice(0, 6)}...{player.address.slice(-4)}
                    </span>
                    <div className="flex items-center space-x-2">
                      {player.address === address && (
                        <span className="text-xs text-blue-400">You</span>
                      )}
                      {hasVoted && votedFor === player.index && (
                        <span className="text-xs text-green-400">Your vote</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {!hasVoted && !isTimeUp && (
            <Button 
              onClick={handleVote}
              disabled={!canVote}
              className="w-full h-12 text-lg bg-red-600 hover:bg-red-700 disabled:bg-gray-700"
            >
              {selectedPlayer ? "Submit Vote" : "Select a player to vote"}
            </Button>
          )}

          <Button 
            onClick={onBack}
            variant="outline" 
            className="w-full h-12 text-lg border-gray-600 text-white hover:bg-gray-800"
          >
            {isTimeUp || hasVoted ? "Back to Game" : "Cancel Vote"}
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>🗳️ Vote for the player you think is the imposter</p>
          <p>• Player with most votes gets ejected</p>
          <p>• If imposter is ejected, crew wins</p>
          <p>• If crew is ejected, game continues</p>
        </div>
      </div>
    </div>
  );
}