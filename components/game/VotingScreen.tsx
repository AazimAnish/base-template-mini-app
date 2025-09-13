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
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-black to-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Voting Time</h1>
          <p className="text-gray-300">
            Who do you think is the Traitor? Choose wisely - majority rules.
          </p>
        </div>

        {/* Timer */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Timer className="h-6 w-6 text-yellow-500" />
              <div className="flex-1">
                <div className="flex justify-between text-sm text-gray-300 mb-1">
                  <span>Voting ends in:</span>
                  <span className="font-mono">{timeRemaining}s</span>
                </div>
                <Progress 
                  value={timePercentage} 
                  className={`h-2 ${timeRemaining < 10 ? "[&>div]:bg-red-500" : "[&>div]:bg-yellow-500"}`}
                />
              </div>
              <Badge variant="outline" className="text-white border-white">
                Round {currentRound}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Voting status */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Vote className="h-5 w-5 text-blue-500" />
              Voting Status ({votes.length}/{alivePlayers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <div className="flex -space-x-2">
                {votes.slice(0, 5).map((vote, index) => (
                  <div
                    key={index}
                    className="w-8 h-8 bg-green-500 rounded-full border-2 border-gray-800 flex items-center justify-center"
                  >
                    <span className="text-xs font-bold text-white">✓</span>
                  </div>
                ))}
                {votes.length > 5 && (
                  <div className="w-8 h-8 bg-green-500 rounded-full border-2 border-gray-800 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">+{votes.length - 5}</span>
                  </div>
                )}
              </div>
              <span>{votes.length} of {alivePlayers.length} players have voted</span>
            </div>
          </CardContent>
        </Card>

        {isEliminated ? (
          // Eliminated player view
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">You Are Eliminated</h2>
              <p className="text-gray-300">
                You cannot vote, but you can watch the remaining players decide.
              </p>
            </CardContent>
          </Card>
        ) : hasVoted ? (
          // Already voted view
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Vote className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Vote Submitted</h2>
              <p className="text-gray-300 mb-4">
                You voted to eliminate {players.find(p => p.id === votingTarget)?.name || "a player"}.
                <br />Waiting for other players to vote...
              </p>
              <Badge className="bg-green-600">
                Your vote has been recorded
              </Badge>
            </CardContent>
          </Card>
        ) : (
          // Voting interface
          <div className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
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
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected
                            ? "border-red-500 bg-red-500/20"
                            : "border-gray-600 bg-gray-700 hover:border-gray-500"
                        }`}
                        onClick={() => setSelectedTarget(player.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={player.avatar} />
                            <AvatarFallback className="bg-gray-600 text-white">
                              {(player.name || player.address)?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <p className="font-medium text-white">
                              {player.name || `Player ${index + 1}`}
                            </p>
                            <p className="text-xs text-gray-400">
                              {player.address ? 
                                `${player.address.slice(0, 6)}...${player.address.slice(-4)}` : 
                                "Anonymous"
                              }
                            </p>
                          </div>
                          
                          <div className="text-right">
                            {voteCount > 0 && (
                              <Badge className="bg-red-600 mb-1">
                                {voteCount} vote{voteCount !== 1 ? 's' : ''}
                              </Badge>
                            )}
                            {isSelected && (
                              <div className="text-red-400 text-xs">
                                Selected
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex justify-center">
                  <Button
                    onClick={handleVote}
                    disabled={!selectedTarget}
                    size="lg"
                    className="bg-red-600 hover:bg-red-700 text-white px-8"
                  >
                    <Vote className="h-5 w-5 mr-2" />
                    Cast Vote to Eliminate
                  </Button>
                </div>

                {selectedTarget && (
                  <p className="text-center text-sm text-gray-400 mt-2">
                    You are voting to eliminate{" "}
                    <span className="text-white font-medium">
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