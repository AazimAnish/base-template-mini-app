"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useGameStore } from "@/lib/stores/gameStore";
import { Vote, Timer, Users, AlertCircle } from "lucide-react";

export function VotingScreen() {
  const {
    timeRemaining,
    setTimeRemaining,
    players,
    votes,
    hasVoted,
    votingTarget,
    castVote,
    myPlayerId,
    isEliminated,
    eliminatePlayer,
    nextRound,
    currentRound
  } = useGameStore();

  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

  const handleVotingEnd = useCallback(() => {
    // Count votes and determine elimination
    const voteCounts: { [playerId: string]: number } = {};
    const alivePlayers = players.filter(p => !p.isEliminated);
    
    votes.forEach(vote => {
      voteCounts[vote.targetId] = (voteCounts[vote.targetId] || 0) + 1;
    });

    // Find player with most votes
    let maxVotes = 0;
    let eliminatedPlayer: string | null = null;
    let tiedPlayers: string[] = [];

    Object.entries(voteCounts).forEach(([playerId, voteCount]) => {
      if (voteCount > maxVotes) {
        maxVotes = voteCount;
        eliminatedPlayer = playerId;
        tiedPlayers = [playerId];
      } else if (voteCount === maxVotes && maxVotes > 0) {
        tiedPlayers.push(playerId);
      }
    });

    // If there's a tie, no one gets eliminated
    if (tiedPlayers.length > 1) {
      eliminatedPlayer = null;
    }

    // Eliminate the player if there's a clear majority
    if (eliminatedPlayer && maxVotes > alivePlayers.length / 2) {
      eliminatePlayer(eliminatedPlayer);
    }

    // Check win conditions or continue to next round
    setTimeout(() => {
      // const remainingPlayers = players.filter(p => !p.isEliminated && p.id !== eliminatedPlayer);
      // const traitorEliminated = eliminatedPlayer && players.find(p => p.id === eliminatedPlayer);
      
      // TODO: Check if eliminated player was traitor (need server-side verification)
      // For now, continue to next round
      nextRound();
    }, 3000);
  }, [players, votes, eliminatePlayer, nextRound]);

  useEffect(() => {
    if (timeRemaining <= 0) {
      handleVotingEnd();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(timeRemaining - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, setTimeRemaining, handleVotingEnd]);

  const handleVote = () => {
    if (!selectedTarget || hasVoted || isEliminated) return;
    castVote(selectedTarget);
  };

  const alivePlayers = players.filter(p => !p.isEliminated);
  const votableTargets = alivePlayers.filter(p => p.id !== myPlayerId);
  const timePercentage = (timeRemaining / 30) * 100; // 30 seconds voting time
  
  // Calculate vote counts for display
  const voteCounts: { [playerId: string]: number } = {};
  votes.forEach(vote => {
    voteCounts[vote.targetId] = (voteCounts[vote.targetId] || 0) + 1;
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-light text-black mb-3">Voting Time</h1>
          <p className="text-gray-600 text-lg">
            Who do you think is the traitor? Choose wisely—majority rules.
          </p>
        </div>

        <Card className="border border-gray-200 shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Timer className="h-5 w-5 text-gray-700" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-sm font-medium text-gray-900 mb-2">
                  <span>Voting ends in:</span>
                  <span className="font-mono">{timeRemaining}s</span>
                </div>
                <Progress 
                  value={timePercentage} 
                  className={`h-2 ${timeRemaining < 10 ? "[&>div]:bg-red-500" : "[&>div]:bg-blue-500"}`}
                />
              </div>
              <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                Round {currentRound}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-medium text-black flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <Vote className="h-4 w-4 text-gray-700" />
              </div>
              Voting Status ({votes.length}/{alivePlayers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <div className="flex -space-x-2">
                {votes.slice(0, 5).map((vote, index) => (
                  <div
                    key={index}
                    className="w-8 h-8 bg-green-500 rounded-full border-2 border-white flex items-center justify-center"
                  >
                    <span className="text-xs font-bold text-white">✓</span>
                  </div>
                ))}
                {votes.length > 5 && (
                  <div className="w-8 h-8 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-xs font-bold text-white">+{votes.length - 5}</span>
                  </div>
                )}
              </div>
              <span>{votes.length} of {alivePlayers.length} players have voted</span>
            </div>
          </CardContent>
        </Card>

        {isEliminated ? (
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-orange-600" />
              </div>
              <h2 className="text-2xl font-medium text-black mb-2">You Are Eliminated</h2>
              <p className="text-gray-600">
                You cannot vote, but you can watch the remaining players decide.
              </p>
            </CardContent>
          </Card>
        ) : hasVoted ? (
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Vote className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-medium text-black mb-2">Vote Submitted</h2>
              <p className="text-gray-600 mb-4">
                You voted to eliminate {players.find(p => p.id === votingTarget)?.name || "a player"}.
                <br />Waiting for other players to vote...
              </p>
              <Badge className="bg-green-100 text-green-800">
                Your vote has been recorded
              </Badge>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-medium text-black flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Users className="h-4 w-4 text-gray-700" />
                  </div>
                  Select Player to Eliminate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {votableTargets.map((player, index) => {
                    const voteCount = voteCounts[player.id] || 0;
                    const isSelected = selectedTarget === player.id;
                    
                    return (
                      <div
                        key={player.id}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? "border-red-500 bg-red-50"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                        }`}
                        onClick={() => setSelectedTarget(player.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={player.avatar} />
                            <AvatarFallback className="bg-gray-200 text-gray-700">
                              {(player.name || player.address)?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <p className="font-medium text-black">
                              {player.name || `Player ${index + 1}`}
                            </p>
                            <p className="text-xs text-gray-600">
                              {player.address ? 
                                `${player.address.slice(0, 6)}...${player.address.slice(-4)}` : 
                                "Anonymous"
                              }
                            </p>
                          </div>
                          
                          <div className="text-right">
                            {voteCount > 0 && (
                              <Badge className="bg-red-100 text-red-800 mb-1">
                                {voteCount} vote{voteCount !== 1 ? 's' : ''}
                              </Badge>
                            )}
                            {isSelected && (
                              <div className="text-red-600 text-xs font-medium">
                                Selected
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 flex justify-center">
                  <Button
                    onClick={handleVote}
                    disabled={!selectedTarget}
                    size="lg"
                    className="bg-red-600 hover:bg-red-700 text-white px-8 h-12 font-medium"
                  >
                    <Vote className="h-5 w-5 mr-2" />
                    Cast Vote to Eliminate
                  </Button>
                </div>

                {selectedTarget && (
                  <p className="text-center text-sm text-gray-600 mt-3">
                    You are voting to eliminate{" "}
                    <span className="text-black font-medium">
                      {players.find(p => p.id === selectedTarget)?.name || "this player"}
                    </span>
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}