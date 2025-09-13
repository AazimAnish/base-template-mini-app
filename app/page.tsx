"use client";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Wallet } from "@coinbase/onchainkit/wallet";
import { useAccount } from "wagmi";
import { useGameStore } from "@/lib/stores/gameStore";
import { useRouter } from "next/navigation";
import { Gamepad2, Users, Shield, Zap } from "lucide-react";

export default function Home() {
  const { isConnected } = useAccount();
  const { createGame, joinGame } = useGameStore();
  const router = useRouter();
  
  const [stakeAmount, setStakeAmount] = useState("0.01");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [lobbyId, setLobbyId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleCreateGame = async () => {
    if (!isConnected) return;
    
    try {
      setIsCreating(true);
      await createGame(BigInt(Math.floor(parseFloat(stakeAmount) * 1e18)), maxPlayers);
      router.push("/lobby");
    } catch (error) {
      console.error("Failed to create game:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGame = async () => {
    if (!isConnected || !lobbyId) return;
    
    try {
      setIsJoining(true);
      await joinGame(lobbyId.toUpperCase());
      router.push("/lobby");
    } catch (error) {
      console.error("Failed to join game:", error);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-black to-gray-900 p-4">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-red-500" />
          <h1 className="text-3xl font-bold text-white">SUS</h1>
          <Badge variant="destructive">BETA</Badge>
        </div>
        <Wallet />
      </header>

      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-white mb-4">
            Trust No One.
            <span className="text-red-500"> Stake Everything.</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            A multiplayer social deduction game where players stake ETH and try to identify the Traitor among them. 
            Will you work together to find the impostor, or will you be the one who rugs the pot?
          </p>
          
          {/* Game Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">3-10 Players</h3>
                <p className="text-gray-300 text-sm">
                  Gather your friends or play with strangers in fast-paced rounds
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6 text-center">
                <Zap className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">Real ETH Stakes</h3>
                <p className="text-gray-300 text-sm">
                  Winners split the pot, traitors can rug it all - real money, real consequences
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6 text-center">
                <Gamepad2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">5min Games</h3>
                <p className="text-gray-300 text-sm">
                  Quick rounds with real-time chat, voting, and dramatic reveals
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Game Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Create Game */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                Create New Game
              </CardTitle>
              <CardDescription className="text-gray-300">
                Start a new lobby and invite friends
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">
                  Stake Amount (ETH)
                </label>
                <Input
                  type="number"
                  step="0.001"
                  min="0.001"
                  max="1"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="0.01"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-300 mb-2 block">
                  Max Players
                </label>
                <select
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                >
                  {[3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <option key={num} value={num}>{num} players</option>
                  ))}
                </select>
              </div>
              
              <Button
                onClick={handleCreateGame}
                disabled={!isConnected || isCreating}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isCreating ? "Creating..." : `Create Game (${stakeAmount} ETH)`}
              </Button>
              
              {!isConnected && (
                <p className="text-sm text-gray-400 text-center">
                  Connect your wallet to create a game
                </p>
              )}
            </CardContent>
          </Card>

          {/* Join Game */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Join Existing Game
              </CardTitle>
              <CardDescription className="text-gray-300">
                Enter a lobby ID to join friends
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">
                  Lobby ID
                </label>
                <Input
                  type="text"
                  value={lobbyId}
                  onChange={(e) => setLobbyId(e.target.value.toUpperCase())}
                  className="bg-gray-700 border-gray-600 text-white font-mono"
                  placeholder="ABCD12"
                  maxLength={6}
                />
              </div>
              
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="text-sm text-gray-300">
                  <strong>How to play:</strong>
                </p>
                <ul className="text-sm text-gray-400 mt-1 space-y-1">
                  <li>• 1 player is secretly the Traitor</li>
                  <li>• Crew wins by eliminating the Traitor</li>
                  <li>• Traitor wins by surviving or rugging the pot</li>
                  <li>• Winners split the ETH pot</li>
                </ul>
              </div>
              
              <Button
                onClick={handleJoinGame}
                disabled={!isConnected || !lobbyId || isJoining}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isJoining ? "Joining..." : "Join Game"}
              </Button>
              
              {!isConnected && (
                <p className="text-sm text-gray-400 text-center">
                  Connect your wallet to join a game
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 text-gray-400 text-sm">
          <p>Built on Base • Smart contracts handle all ETH automatically</p>
          <p className="mt-1">
            <strong className="text-red-400">Warning:</strong> This is a game of deception. Only play with ETH you can afford to lose.
          </p>
        </footer>
      </div>
    </div>
  );
}
