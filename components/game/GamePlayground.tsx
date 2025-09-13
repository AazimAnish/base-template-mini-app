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
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-black to-gray-900 p-4">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-white">SUS</h1>
          </div>
          
          <Badge variant="outline" className="text-white border-white">
            Round {currentRound}
          </Badge>
          
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            <span className="text-white font-semibold">
              {formatEther(potSize)} ETH
            </span>
          </div>
        </div>

        {/* Role indicator */}
        <Badge 
          variant={myRole === "traitor" ? "destructive" : "default"}
          className={`${
            myRole === "traitor" 
              ? "bg-red-600 hover:bg-red-700" 
              : "bg-blue-600 hover:bg-blue-700"
          } ${isEliminated ? "opacity-50" : ""}`}
        >
          {isEliminated ? "ELIMINATED" : myRole?.toUpperCase()}
        </Badge>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {/* Chat Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Timer and Actions */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Timer className="h-5 w-5 text-yellow-500" />
                Discussion Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-300 mb-1">
                    <span>Time Remaining</span>
                    <span>{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</span>
                  </div>
                  <Progress 
                    value={timePercentage} 
                    className={`h-3 ${timeRemaining < 30 ? "[&>div]:bg-red-500" : "[&>div]:bg-yellow-500"}`}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleCallVote}
                    disabled={isEliminated}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Vote className="h-4 w-4 mr-2" />
                    Call Vote
                  </Button>

                  {myRole === "traitor" && !isEliminated && (
                    <Button
                      onClick={handleRugPot}
                      disabled={isRugging}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      {isRugging ? "RUGGING..." : "RUG POT"}
                    </Button>
                  )}
                </div>

                {isEliminated && (
                  <div className="bg-gray-700 p-3 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <p className="text-gray-300 text-sm">
                      You have been eliminated. You can watch but cannot participate.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chat */}
          <Card className="bg-gray-800 border-gray-700 flex-1">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-green-500" />
                Discussion
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-96">
              <ChatComponent disabled={isEliminated} />
            </CardContent>
          </Card>
        </div>

        {/* Players and Game Info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Game Status */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                Game Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-white">{alivePlayers.length}</p>
                  <p className="text-sm text-gray-300">Players Alive</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{currentRound}</p>
                  <p className="text-sm text-gray-300">Current Round</p>
                </div>
              </div>

              {/* Victory conditions reminder */}
              <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                <p className="text-xs text-gray-300 text-center">
                  <strong>Crew:</strong> Find and eliminate the Traitor<br />
                  <strong>Traitor:</strong> Survive or rug the pot
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Players List */}
          <Card className="bg-gray-800 border-gray-700 flex-1">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Players ({alivePlayers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PlayersList showVoteButton={false} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile-friendly bottom actions */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4">
        <div className="flex gap-2 max-w-sm mx-auto">
          <Button
            onClick={handleCallVote}
            disabled={isEliminated}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <Vote className="h-4 w-4 mr-2" />
            Vote
          </Button>

          {myRole === "traitor" && !isEliminated && (
            <Button
              onClick={handleRugPot}
              disabled={isRugging}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              RUG
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}