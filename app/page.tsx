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
    <div className="min-h-screen bg-white">
      <header className="px-4 py-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-black">SUS</h1>
            <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-xs">Beta</Badge>
          </div>
          <Wallet />
        </div>
      </header>

      <main className="px-4 pb-20 max-w-6xl mx-auto">
        <section className="text-center py-16 max-w-3xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-light text-black mb-6 leading-tight">
            Social deduction.
            <br />
            <span className="font-medium">Reinvented.</span>
          </h2>
          <p className="text-lg text-gray-600 mb-12 leading-relaxed max-w-2xl mx-auto">
            A multiplayer game where trust is earned and ETH is at stake. 
            Find the traitor, or become one.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-gray-700" />
              </div>
              <h3 className="font-medium text-black mb-2">3-10 Players</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Quick rounds with friends or strangers
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-gray-700" />
              </div>
              <h3 className="font-medium text-black mb-2">Real Stakes</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Winners share the ETH pot
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Gamepad2 className="h-6 w-6 text-gray-700" />
              </div>
              <h3 className="font-medium text-black mb-2">5 Minutes</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Fast-paced rounds with real-time interaction
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-medium text-black">
                Create Game
              </CardTitle>
              <CardDescription className="text-gray-600">
                Start a new lobby and set the stakes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-900 mb-3 block">
                  Stake Amount (ETH)
                </label>
                <Input
                  type="number"
                  step="0.001"
                  min="0.001"
                  max="1"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="h-12 border-gray-300 focus:border-black focus:ring-1 focus:ring-black text-black placeholder:text-gray-400 bg-white"
                  placeholder="0.01"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-900 mb-3 block">
                  Max Players
                </label>
                <select
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  className="w-full h-12 px-3 border border-gray-300 rounded-md text-black focus:border-black focus:ring-1 focus:ring-black bg-white"
                >
                  {[3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <option key={num} value={num}>{num} players</option>
                  ))}
                </select>
              </div>
              
              <Button
                onClick={handleCreateGame}
                disabled={!isConnected || isCreating}
                className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium"
              >
                {isCreating ? "Creating..." : `Create Game`}
              </Button>
              
              {!isConnected && (
                <p className="text-sm text-gray-600 text-center">
                  Connect wallet to create
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-medium text-black">
                Join Game
              </CardTitle>
              <CardDescription className="text-gray-600">
                Enter a lobby ID to join friends
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-900 mb-3 block">
                  Lobby ID
                </label>
                <Input
                  type="text"
                  value={lobbyId}
                  onChange={(e) => setLobbyId(e.target.value.toUpperCase())}
                  className="h-12 border-gray-300 focus:border-black focus:ring-1 focus:ring-black font-mono text-center tracking-widest text-black placeholder:text-gray-400 bg-white"
                  placeholder="ABCD12"
                  maxLength={6}
                />
              </div>
              
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-sm font-medium text-gray-900 mb-2">
                  How to play:
                </p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• One player is secretly the traitor</li>
                  <li>• Crew wins by eliminating the traitor</li>
                  <li>• Traitor wins by surviving or rugging</li>
                  <li>• Winners split the ETH pot</li>
                </ul>
              </div>
              
              <Button
                onClick={handleJoinGame}
                disabled={!isConnected || !lobbyId || isJoining}
                className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium"
              >
                {isJoining ? "Joining..." : "Join Game"}
              </Button>
              
              {!isConnected && (
                <p className="text-sm text-gray-600 text-center">
                  Connect wallet to join
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        <footer className="text-center mt-16 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-2">Built on Base</p>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            This is a game of deception. Only play with ETH you can afford to lose.
          </p>
        </footer>
      </main>
    </div>
  );
}
