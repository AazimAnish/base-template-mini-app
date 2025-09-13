"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useGameStore } from "@/lib/stores/gameStore";
// import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { 
  Users, 
  Shield, 
  Copy, 
  CheckCircle2, 
  Clock, 
  Coins,
  Play,
  UserPlus,
  Crown
} from "lucide-react";
import { toast } from "sonner";

export default function LobbyPage() {
  const router = useRouter();
  // const { isConnected } = useAccount(); // Currently unused but needed for future wallet integration
  const {
    gameId,
    lobbyId,
    players,
    maxPlayers,
    stakeAmount,
    potSize,
    isHost,
    myPlayerId,
    startGame,
    leaveGame,
    phase
  } = useGameStore();

  const [copied, setCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (!gameId || !lobbyId) {
      router.push("/");
      return;
    }

    if (phase !== "lobby") {
      router.push("/game");
      return;
    }
  }, [gameId, lobbyId, phase, router]);

  const handleCopyLobbyId = async () => {
    if (!lobbyId) return;
    
    try {
      await navigator.clipboard.writeText(lobbyId);
      setCopied(true);
      toast.success("Lobby ID copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy lobby ID");
    }
  };

  const handleStartGame = async () => {
    if (players.length < 3) {
      toast.error("Need at least 3 players to start!");
      return;
    }

    try {
      setIsStarting(true);
      await startGame();
    } catch (error) {
      console.error("Failed to start game:", error);
      toast.error("Failed to start game");
    } finally {
      setIsStarting(false);
    }
  };

  const handleLeaveGame = () => {
    leaveGame();
    router.push("/");
  };

  // const readyPlayers = players.filter(p => p.isReady).length;
  const fillPercentage = (players.length / maxPlayers) * 100;

  if (!gameId || !lobbyId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-950 via-black to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">No Active Game</h2>
          <p className="text-gray-300 mb-4">You don&apos;t have an active game session.</p>
          <Button onClick={() => router.push("/")} className="bg-red-600 hover:bg-red-700">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-black to-gray-900 p-4">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-red-500" />
          <h1 className="text-3xl font-bold text-white">SUS</h1>
          <Badge variant="outline" className="text-white border-white">
            LOBBY
          </Badge>
        </div>
        <Button 
          variant="outline" 
          onClick={handleLeaveGame}
          className="text-white border-white hover:bg-white hover:text-black"
        >
          Leave Game
        </Button>
      </header>

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Game Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lobby Info Card */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Lobby: {lobbyId}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyLobbyId}
                  className="ml-auto h-8 w-8 p-0"
                >
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-sm text-gray-300">Stake</p>
                    <p className="font-bold text-white">
                      {formatEther(stakeAmount)} ETH
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-300">Total Pot</p>
                    <p className="font-bold text-white">
                      {formatEther(potSize)} ETH
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Player Progress */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-purple-500" />
                  Players ({players.length}/{maxPlayers})
                </span>
                <Badge 
                  variant={players.length >= 3 ? "default" : "destructive"}
                  className={players.length >= 3 ? "bg-green-600" : ""}
                >
                  {players.length >= 3 ? "Ready to Start" : "Need More Players"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-300 mb-1">
                    <span>Lobby Fill</span>
                    <span>{Math.round(fillPercentage)}%</span>
                  </div>
                  <Progress value={fillPercentage} className="h-2" />
                </div>
                
                <div className="text-center">
                  <p className="text-gray-300 text-sm mb-2">
                    Share this lobby ID with friends:
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <code className="bg-gray-700 px-3 py-1 rounded font-mono text-lg text-white">
                      {lobbyId}
                    </code>
                    <Button size="sm" onClick={handleCopyLobbyId}>
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Host Controls */}
          {isHost && (
            <Card className="bg-gray-800 border-gray-700 border-green-500/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Host Controls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleStartGame}
                  disabled={players.length < 3 || isStarting}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
                  size="lg"
                >
                  {isStarting ? (
                    <>
                      <Clock className="h-5 w-5 mr-2 animate-spin" />
                      Starting Game...
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-2" />
                      Start Game
                    </>
                  )}
                </Button>
                
                {players.length < 3 && (
                  <p className="text-sm text-gray-400 text-center mt-2">
                    Need at least 3 players to start
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Players List */}
        <div>
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Players
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {players.map((player, index) => (
                  <div
                    key={player.id}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      player.id === myPlayerId 
                        ? "bg-blue-600/20 border border-blue-500/50" 
                        : "bg-gray-700"
                    }`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={player.avatar} />
                      <AvatarFallback className="bg-gray-600 text-white">
                        {(player.name || player.address)?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">
                          {player.name || `Player ${index + 1}`}
                          {player.id === myPlayerId && (
                            <span className="text-blue-400 text-sm ml-1">(You)</span>
                          )}
                        </p>
                        {index === 0 && (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {player.address ? 
                          `${player.address.slice(0, 6)}...${player.address.slice(-4)}` : 
                          "Connecting..."
                        }
                      </p>
                    </div>
                    
                    <Badge 
                      variant={player.isReady ? "default" : "secondary"}
                      className={player.isReady ? "bg-green-600" : "bg-yellow-600"}
                    >
                      {player.isReady ? "Ready" : "Waiting"}
                    </Badge>
                  </div>
                ))}
                
                {/* Empty slots */}
                {Array.from({ length: maxPlayers - players.length }).map((_, index) => (
                  <div
                    key={`empty-${index}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/50 border-2 border-dashed border-gray-600"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gray-600 text-gray-400">
                        ?
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-gray-400">
                        Waiting for player...
                      </p>
                      <p className="text-xs text-gray-500">
                        Empty slot
                      </p>
                    </div>
                    <Badge variant="outline" className="text-gray-400 border-gray-600">
                      Open
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Game Rules reminder */}
      <Card className="max-w-4xl mx-auto mt-6 bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-2">Game Rules</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
              <div>
                <strong className="text-blue-400">For Crew:</strong>
                <br />Find and eliminate the Traitor through voting. Winners split the pot.
              </div>
              <div>
                <strong className="text-red-400">For Traitor:</strong>
                <br />Survive until the end OR rug the entire pot at any time.
              </div>
              <div>
                <strong className="text-yellow-400">Voting:</strong>
                <br />30-second rounds. Majority eliminates. Ties = no elimination.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}