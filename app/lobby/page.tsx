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
import { useMiniApp, useGameFeatures, useSocialFeatures } from "@/lib/miniapp/hooks";

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

  // Mini App integration
  const { isInFarcaster, hapticFeedback } = useMiniApp();
  const { notifyGameStart } = useGameFeatures();
  const { inviteToLobby } = useSocialFeatures();

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
      await hapticFeedback('selection');
      setCopied(true);
      toast.success("Lobby ID copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy lobby ID");
    }
  };

  const handleStartGame = async () => {
    if (players.length < 3) {
      await hapticFeedback('notification', 'error');
      toast.error("Need at least 3 players to start!");
      return;
    }

    try {
      setIsStarting(true);
      await hapticFeedback('impact', 'heavy');
      await startGame();
      
      // Notify all players that game is starting
      if (lobbyId) {
        await notifyGameStart(lobbyId);
      }
      
      await hapticFeedback('notification', 'success');
      toast.success("Game started!");
    } catch (error) {
      console.error("Failed to start game:", error);
      await hapticFeedback('notification', 'error');
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
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-gray-600" />
          </div>
          <h2 className="text-2xl font-medium text-black mb-2">No Active Game</h2>
          <p className="text-gray-600 mb-6">You don&apos;t have an active game session.</p>
          <Button onClick={() => router.push("/")} className="bg-black hover:bg-gray-800 text-white">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="px-4 py-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-black">SUS</h1>
            <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-xs">
              Lobby
            </Badge>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLeaveGame}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Leave Game
          </Button>
        </div>
      </header>

      <main className="px-4 pb-20 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-medium text-black flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Users className="h-4 w-4 text-gray-700" />
                  </div>
                  Lobby {lobbyId}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyLobbyId}
                    className="ml-auto h-9 w-9 p-2 border-gray-300 hover:bg-gray-50 flex items-center justify-center"
                    title={copied ? "Copied!" : "Copy lobby ID"}
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-600" />
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Coins className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">Stake</span>
                    </div>
                    <p className="text-2xl font-semibold text-black">
                      {formatEther(stakeAmount)} ETH
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">Total Pot</span>
                    </div>
                    <p className="text-2xl font-semibold text-black">
                      {formatEther(potSize)} ETH
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-medium text-black flex items-center justify-between">
                  <span className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <UserPlus className="h-4 w-4 text-gray-700" />
                    </div>
                    Players ({players.length}/{maxPlayers})
                  </span>
                  <Badge 
                    variant={players.length >= 3 ? "default" : "secondary"}
                    className={players.length >= 3 ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}
                  >
                    {players.length >= 3 ? "Ready" : "Need More"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm font-medium text-gray-900 mb-2">
                      <span>Lobby Progress</span>
                      <span>{Math.round(fillPercentage)}%</span>
                    </div>
                    <Progress value={fillPercentage} className="h-2" />
                  </div>
                  
                  <div className="text-center bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm font-medium text-gray-900 mb-3">
                      Share with friends:
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-3">
                        <code className="bg-white px-4 py-2 rounded-lg border font-mono text-lg text-black tracking-wider">
                          {lobbyId}
                        </code>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={handleCopyLobbyId} 
                          className="border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2"
                          title={copied ? "Lobby ID copied!" : "Copy lobby ID to clipboard"}
                        >
                          {copied ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-1" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {isInFarcaster && lobbyId && (
                        <Button
                          size="sm"
                          onClick={() => inviteToLobby(lobbyId)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                        >
                          📢 Share Game
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {isHost && (
              <Card className="border-2 border-blue-200 bg-blue-50 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-medium text-black flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Crown className="h-4 w-4 text-yellow-600" />
                    </div>
                    Host Controls
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleStartGame}
                    disabled={players.length < 3 || isStarting}
                    className="w-full h-12 bg-black hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 text-white font-medium"
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
                    <p className="text-sm text-gray-600 text-center mt-3">
                      Need at least 3 players to start
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-medium text-black flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Users className="h-4 w-4 text-gray-700" />
                  </div>
                  Players
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {players.map((player, index) => (
                    <div
                      key={player.id}
                      className={`flex items-center gap-3 p-4 rounded-xl ${
                        player.id === myPlayerId 
                          ? "bg-blue-50 border border-blue-200" 
                          : "bg-gray-50"
                      }`}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={player.avatar} />
                        <AvatarFallback className="bg-gray-200 text-gray-700">
                          {(player.name || player.address)?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-black">
                            {player.name || `Player ${index + 1}`}
                            {player.id === myPlayerId && (
                              <span className="text-blue-600 text-sm ml-1">(You)</span>
                            )}
                          </p>
                          {index === 0 && (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600">
                          {player.address ? 
                            `${player.address.slice(0, 6)}...${player.address.slice(-4)}` : 
                            "Connecting..."
                          }
                        </p>
                      </div>
                      
                      <Badge 
                        variant={player.isReady ? "default" : "secondary"}
                        className={player.isReady ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}
                      >
                        {player.isReady ? "Ready" : "Waiting"}
                      </Badge>
                    </div>
                  ))}
                  
                  {Array.from({ length: maxPlayers - players.length }).map((_, index) => (
                    <div
                      key={`empty-${index}`}
                      className="flex items-center gap-3 p-4 rounded-xl bg-white border-2 border-dashed border-gray-300"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gray-100 text-gray-400">
                          ?
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-gray-500">
                          Waiting for player...
                        </p>
                        <p className="text-xs text-gray-400">
                          Empty slot
                        </p>
                      </div>
                      <Badge variant="outline" className="text-gray-400 border-gray-300">
                        Open
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="max-w-4xl mx-auto mt-8 border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-black mb-4">Game Rules</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <strong className="text-blue-700 block mb-1">For Crew:</strong>
                  <p className="text-gray-700">Find and eliminate the traitor through voting. Winners split the pot.</p>
                </div>
                <div className="p-4 bg-red-50 rounded-xl">
                  <strong className="text-red-700 block mb-1">For Traitor:</strong>
                  <p className="text-gray-700">Survive until the end OR rug the entire pot at any time.</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-xl">
                  <strong className="text-yellow-700 block mb-1">Voting:</strong>
                  <p className="text-gray-700">30-second rounds. Majority eliminates. Ties = no elimination.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}