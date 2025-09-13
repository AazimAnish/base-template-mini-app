"use client";

import { useState } from "react";
import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Share } from "lucide-react";

interface Player {
  address: string;
  index: number;
  role: "CREW" | "IMPOSTER";
  isWinner: boolean;
}

interface GameEndProps {
  gameResult: "CREW_WIN" | "IMPOSTER_WIN" | "RUGGED";
  userRole: "CREW" | "IMPOSTER";
  isWinner: boolean;
  winnings: string;
  imposterAddress?: string;
  ejectedPlayer?: string;
  players: Player[];
  onPlayAgain: () => void;
  onShareResult: () => void;
  onBackToHome: () => void;
}

export function GameEnd({ 
  gameResult,
  userRole,
  isWinner,
  winnings,
  imposterAddress,
  ejectedPlayer,
  players,
  onPlayAgain,
  onShareResult,
  onBackToHome
}: GameEndProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getResultTitle = () => {
    switch (gameResult) {
      case "CREW_WIN":
        return userRole === "CREW" ? "Victory!" : "You Lost!";
      case "IMPOSTER_WIN":
        return userRole === "IMPOSTER" ? "Victory!" : "You Lost!";
      case "RUGGED":
        return userRole === "IMPOSTER" ? "RUG SUCCESSFUL!" : "TRAITOR WON!!";
      default:
        return "Game Over";
    }
  };

  const getResultMessage = () => {
    switch (gameResult) {
      case "CREW_WIN":
        return userRole === "CREW" 
          ? "The imposter was ejected! You win!" 
          : "You were caught and ejected!";
      case "IMPOSTER_WIN":
        return userRole === "IMPOSTER"
          ? "You eliminated all crew members!"
          : "The imposter won!";
      case "RUGGED":
        return userRole === "IMPOSTER"
          ? "You successfully stole the pot!"
          : "The imposter rugged and took all the funds!";
      default:
        return "";
    }
  };

  const getResultEmoji = () => {
    switch (gameResult) {
      case "CREW_WIN":
        return userRole === "CREW" ? "🎉" : "💀";
      case "IMPOSTER_WIN":
        return userRole === "IMPOSTER" ? "😈" : "💀";
      case "RUGGED":
        return userRole === "IMPOSTER" ? "💰" : "💸";
      default:
        return "🎮";
    }
  };

  const winners = players.filter(p => p.isWinner);
  const imposter = players.find(p => p.role === "IMPOSTER");

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-500 mb-4">SUS</h1>
        </div>

        {/* Role Reveal */}
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className={`inline-block px-4 py-2 rounded-full text-lg font-semibold ${
                userRole === "IMPOSTER" 
                  ? "bg-red-600 text-white" 
                  : "bg-blue-600 text-white"
              }`}>
                You are {userRole === "IMPOSTER" ? "TRAITOR" : "CREW"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Result Card */}
        <Card className={`border-2 ${
          isWinner 
            ? "border-green-500 bg-green-900/20" 
            : "border-red-500 bg-red-900/20"
        }`}>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-6xl">{getResultEmoji()}</div>
              <h2 className={`text-3xl font-bold ${
                isWinner ? "text-green-400" : "text-red-400"
              }`}>
                {getResultTitle()}
              </h2>
              <p className="text-lg text-gray-300">
                {getResultMessage()}
              </p>
              
              {winnings !== "0" && (
                <div className="bg-green-900/50 p-4 rounded-lg">
                  <p className="text-green-400 font-semibold text-xl">
                    💰 You won {winnings} ETH!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Game Details */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle 
              className="text-white cursor-pointer flex items-center justify-between"
              onClick={() => setShowDetails(!showDetails)}
            >
              Game Details
              <span className="text-sm">
                {showDetails ? "▼" : "▶"}
              </span>
            </CardTitle>
          </CardHeader>
          {showDetails && (
            <CardContent>
              <div className="space-y-4">
                {/* Imposter Reveal */}
                {imposter && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">The Imposter was:</p>
                    <div className="bg-red-900/30 p-3 rounded border border-red-700">
                      <span className="font-mono text-sm">
                        {imposter.address.slice(0, 6)}...{imposter.address.slice(-4)}
                      </span>
                      <span className="text-red-400 ml-2">👹</span>
                    </div>
                  </div>
                )}

                {/* Winners */}
                {winners.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Winners ({winners.length}):</p>
                    <div className="space-y-2">
                      {winners.map((winner) => (
                        <div key={winner.address} className="bg-green-900/30 p-3 rounded border border-green-700">
                          <span className="font-mono text-sm">
                            {winner.address.slice(0, 6)}...{winner.address.slice(-4)}
                          </span>
                          <span className="text-green-400 ml-2">🏆</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ejected Player */}
                {ejectedPlayer && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Ejected:</p>
                    <div className="bg-gray-800 p-3 rounded">
                      <span className="font-mono text-sm">
                        {ejectedPlayer.slice(0, 6)}...{ejectedPlayer.slice(-4)}
                      </span>
                      <span className="text-gray-400 ml-2">💀</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={onShareResult}
            className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 flex items-center justify-center space-x-2"
          >
            <Share className="w-5 h-5" />
            <span>Share on Farcaster</span>
          </Button>

          <Button 
            onClick={onPlayAgain}
            variant="outline" 
            className="w-full h-12 text-lg border-gray-600 text-white hover:bg-gray-800"
          >
            Play Again
          </Button>

          <Button 
            onClick={onBackToHome}
            variant="outline" 
            className="w-full h-12 text-lg border-gray-600 text-white hover:bg-gray-800"
          >
            Back to Home
          </Button>
        </div>

        {/* Stats */}
        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>Game completed • Total players: {players.length}</p>
          {gameResult === "RUGGED" ? (
            <p>🏃 The imposter rugged and took all funds</p>
          ) : gameResult === "CREW_WIN" ? (
            <p>👨‍🚀 Crew successfully identified the imposter</p>
          ) : (
            <p>👹 Imposter eliminated all crew members</p>
          )}
        </div>
      </div>
    </div>
  );
}