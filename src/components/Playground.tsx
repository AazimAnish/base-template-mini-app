"use client";

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/Dialog";
import { ChatInterface } from "~/components/ChatInterface";
import { useAccount } from "wagmi";

interface Player {
  address: string;
  index: number;
  isAlive: boolean;
}

interface PlaygroundProps {
  gameId: string;
  players: Player[];
  userRole: "CREW" | "IMPOSTER";
  pot: string;
  onRug: () => void;
  onStartVote: () => void;
  onBack: () => void;
}

export function Playground({ 
  gameId, 
  players, 
  userRole, 
  pot, 
  onRug, 
  onStartVote,
  onBack 
}: PlaygroundProps) {
  const [showRugDialog, setShowRugDialog] = useState(false);
  const [showVoteDialog, setShowVoteDialog] = useState(false);
  const { address } = useAccount();

  const alivePlayers = players.filter(p => p.isAlive);
  const deadPlayers = players.filter(p => !p.isAlive);

  const handleRug = () => {
    onRug();
    setShowRugDialog(false);
  };

  const handleStartVote = () => {
    onStartVote();
    setShowVoteDialog(false);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-500 mb-2">SUS</h1>
          <h2 className="text-xl font-semibold">Playground</h2>
          <div className="flex justify-center space-x-4 mt-4">
            {alivePlayers.map((_, index) => (
              <div key={index} className="w-8 h-8 bg-blue-600 rounded-full"></div>
            ))}
            {deadPlayers.map((_, index) => (
              <div key={index} className="w-8 h-8 bg-red-600 rounded-full opacity-50"></div>
            ))}
          </div>
        </div>

        {/* Role & Pot Info */}
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                userRole === "IMPOSTER" 
                  ? "bg-red-600 text-white" 
                  : "bg-blue-600 text-white"
              }`}>
                You are {userRole === "IMPOSTER" ? "the IMPOSTER" : "CREW"}
              </div>
              <p className="text-lg font-semibold text-center">
                Pot: {pot} ETH
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-0">
            <ChatInterface 
              players={players}
              userRole={userRole}
              onSendMessage={(message) => console.log("Message sent:", message)}
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          {userRole === "IMPOSTER" && (
            <Dialog open={showRugDialog} onOpenChange={setShowRugDialog}>
              <DialogTrigger asChild>
                <Button className="w-full h-12 text-lg bg-red-600 hover:bg-red-700">
                  🏃 RUG (Steal the pot!)
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-700 text-white">
                <DialogHeader>
                  <DialogTitle className="text-red-400">Execute Rug</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <p className="text-sm text-gray-300">
                    You are about to steal the entire pot of {pot} ETH!
                  </p>
                  <p className="text-xs text-gray-400">
                    • This will end the game immediately
                  </p>
                  <p className="text-xs text-gray-400">
                    • You will win all the funds
                  </p>
                  <p className="text-xs text-gray-400">
                    • Other players will know you were the imposter
                  </p>
                  <Button 
                    onClick={handleRug}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    Confirm Rug
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          <Dialog open={showVoteDialog} onOpenChange={setShowVoteDialog}>
            <DialogTrigger asChild>
              <Button className="w-full h-12 text-lg bg-yellow-600 hover:bg-yellow-700">
                🗳️ Call Vote
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-700 text-white">
              <DialogHeader>
                <DialogTitle>Start Voting</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <p className="text-sm text-gray-300">
                  Call an emergency meeting to vote out a suspected imposter.
                </p>
                <p className="text-xs text-gray-400">
                  • All players have 30 seconds to vote
                </p>
                <p className="text-xs text-gray-400">
                  • Player with most votes gets ejected
                </p>
                <p className="text-xs text-gray-400">
                  • If imposter is ejected, crew wins the pot
                </p>
                <Button 
                  onClick={handleStartVote}
                  className="w-full bg-yellow-600 hover:bg-yellow-700"
                >
                  Start Vote
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            onClick={onBack}
            variant="outline" 
            className="w-full h-12 text-lg border-gray-600 text-white hover:bg-gray-800"
          >
            Leave Game
          </Button>
        </div>

        {/* Game Info */}
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400 mb-2">Alive Players ({alivePlayers.length})</p>
                <div className="space-y-1">
                  {alivePlayers.map((player, index) => (
                    <div key={player.address} className="flex items-center justify-between bg-gray-800 p-2 rounded">
                      <span className="font-mono text-xs">
                        {player.address.slice(0, 6)}...{player.address.slice(-4)}
                      </span>
                      {player.address === address && (
                        <span className="text-xs text-green-400">You</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {deadPlayers.length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">Ejected Players ({deadPlayers.length})</p>
                  <div className="space-y-1">
                    {deadPlayers.map((player) => (
                      <div key={player.address} className="flex items-center bg-gray-800 p-2 rounded opacity-50">
                        <span className="font-mono text-xs">
                          {player.address.slice(0, 6)}...{player.address.slice(-4)}
                        </span>
                        <span className="text-xs text-red-400 ml-2">💀</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Role-specific tips */}
        <div className="text-xs text-gray-500 text-center space-y-1">
          {userRole === "IMPOSTER" ? (
            <>
              <p>🎭 You are the IMPOSTER!</p>
              <p>• Blend in with the crew</p>
              <p>• Rug the pot anytime to win</p>
              <p>• Avoid getting voted out</p>
            </>
          ) : (
            <>
              <p>👨‍🚀 You are CREW!</p>
              <p>• Find and vote out the imposter</p>
              <p>• Work together with other crew</p>
              <p>• Don't let them rug the pot!</p>
            </>
          )}
          {gameId.startsWith('demo_') && (
            <div className="mt-3 p-2 bg-yellow-900/30 border border-yellow-700 rounded">
              <p className="text-yellow-400 text-xs font-semibold">🎮 Demo Mode</p>
              <p className="text-yellow-300 text-xs">Voting will start automatically!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}