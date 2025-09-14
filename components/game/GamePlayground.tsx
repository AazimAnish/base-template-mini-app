"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useGameStore } from "@/lib/stores/gameStore";
import { ChatComponent } from "@/components/chat/ChatComponent";
import { PlayersList } from "@/components/game/PlayersList";
import { formatEther } from "viem";
import { 
  Timer, 
  Users, 
  MessageCircle, 
  Vote, 
  DollarSign,
  AlertTriangle,
  Shield,
  Coins
} from "lucide-react";

export function GamePlayground() {
  const {
    timeRemaining,
    setTimeRemaining,
    setPhase,
    currentRound,
    players,
    potSize,
    myRole,
    isEliminated,
    rugPot
  } = useGameStore();

  const [isRugging, setIsRugging] = useState(false);

  useEffect(() => {
    if (timeRemaining <= 0) {
      setPhase("voting");
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(timeRemaining - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, setTimeRemaining, setPhase]);

  const handleRugPot = async () => {
    if (myRole !== "traitor" || isEliminated) return;
    
    try {
      setIsRugging(true);
      await rugPot();
    } catch (error) {
      console.error("Failed to rug pot:", error);
    } finally {
      setIsRugging(false);
    }
  };

  const handleCallVote = () => {
    setPhase("voting");
  };

  const timePercentage = (timeRemaining / 120) * 100; // 2 minutes = 120 seconds
  const alivePlayers = players.filter(p => !p.isEliminated);

  return (
    <div className="min-h-screen bg-white">
      <header className="px-4 py-6 border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-2xl font-semibold text-black">SUS</h1>
            </div>
            
            <Badge variant="secondary" className="bg-gray-100 text-gray-700">
              Round {currentRound}
            </Badge>
            
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Coins className="h-3 w-3 text-yellow-600" />
              </div>
              <span className="text-black font-medium">
                {formatEther(potSize)} ETH
              </span>
            </div>
          </div>

          <Badge 
            variant={myRole === "traitor" ? "destructive" : "default"}
            className={`${
              myRole === "traitor" 
                ? "bg-red-100 text-red-700 hover:bg-red-200" 
                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
            } ${isEliminated ? "opacity-50" : ""}`}
          >
            {isEliminated ? "Eliminated" : myRole === "traitor" ? "Traitor" : "Crew"}
          </Badge>
        </div>
      </header>

      <main className="p-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-medium text-black flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Timer className="h-4 w-4 text-gray-700" />
                  </div>
                  Discussion Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm font-medium text-gray-900 mb-2">
                      <span>Time Remaining</span>
                      <span>{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</span>
                    </div>
                    <Progress 
                      value={timePercentage} 
                      className={`h-2 ${timeRemaining < 30 ? "[&>div]:bg-red-500" : "[&>div]:bg-green-500"}`}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleCallVote}
                      disabled={isEliminated}
                      className="flex-1 h-11 bg-black hover:bg-gray-800 text-white font-medium"
                    >
                      <Vote className="h-4 w-4 mr-2" />
                      Call Vote
                    </Button>

                    {myRole === "traitor" && !isEliminated && (
                      <Button
                        onClick={handleRugPot}
                        disabled={isRugging}
                        className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white font-medium"
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        {isRugging ? "Rugging..." : "Rug Pot"}
                      </Button>
                    )}
                  </div>

                  {isEliminated && (
                    <div className="bg-orange-50 p-4 rounded-xl flex items-center gap-3 border border-orange-200">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      <p className="text-orange-800 text-sm">
                        You have been eliminated. You can watch but cannot participate.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm flex-1">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-medium text-black flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <MessageCircle className="h-4 w-4 text-gray-700" />
                  </div>
                  Discussion
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-96">
                <ChatComponent disabled={isEliminated} />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-medium text-black flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Users className="h-4 w-4 text-gray-700" />
                  </div>
                  Game Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div>
                    <p className="text-3xl font-light text-black mb-1">{alivePlayers.length}</p>
                    <p className="text-sm font-medium text-gray-600">Players Alive</p>
                  </div>
                  <div>
                    <p className="text-3xl font-light text-black mb-1">{currentRound}</p>
                    <p className="text-sm font-medium text-gray-600">Current Round</p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs font-medium text-gray-800 text-center mb-1">
                    Victory Conditions
                  </p>
                  <p className="text-xs text-gray-700 text-center leading-relaxed">
                    <strong>Crew:</strong> Find and eliminate the Traitor<br />
                    <strong>Traitor:</strong> Survive or rug the pot
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm flex-1">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-medium text-black flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Users className="h-4 w-4 text-gray-700" />
                  </div>
                  Players ({alivePlayers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PlayersList showVoteButton={false} />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="flex gap-3 max-w-sm mx-auto">
            <Button
              onClick={handleCallVote}
              disabled={isEliminated}
              className="flex-1 h-12 bg-black hover:bg-gray-800 text-white font-medium"
            >
              <Vote className="h-4 w-4 mr-2" />
              Vote
            </Button>

            {myRole === "traitor" && !isEliminated && (
              <Button
                onClick={handleRugPot}
                disabled={isRugging}
                className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white font-medium"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Rug
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}