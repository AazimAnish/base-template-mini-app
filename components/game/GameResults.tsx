"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGameStore } from "@/lib/stores/gameStore";
import { useRouter } from "next/navigation";
import { formatEther } from "viem";
import { Trophy, DollarSign, Home, RotateCcw } from "lucide-react";

export function GameResults() {
  const router = useRouter();
  const {
    winners,
    ruggedBy,
    potSize,
    myPlayerId,
    myRole,
    resetGame
  } = useGameStore();

  const isWinner = winners.includes(myPlayerId || "");
  const didRug = ruggedBy === myPlayerId;
  const wasRugged = !!ruggedBy;

  const handlePlayAgain = () => {
    resetGame();
    router.push("/");
  };

  const handleHome = () => {
    resetGame();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-black to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className={`text-center border-4 ${
          didRug ? "bg-red-900/50 border-red-500" :
          isWinner ? "bg-green-900/50 border-green-500" :
          "bg-gray-800 border-gray-700"
        }`}>
          <CardContent className="p-8">
            {/* Result Icon */}
            <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
              didRug ? "bg-red-600" :
              isWinner ? "bg-green-600" :
              "bg-gray-600"
            }`}>
              {didRug || wasRugged ? (
                <DollarSign className="h-12 w-12 text-white" />
              ) : (
                <Trophy className="h-12 w-12 text-white" />
              )}
            </div>

            {/* Result Title */}
            <h1 className={`text-4xl font-bold mb-4 ${
              didRug ? "text-red-400" :
              isWinner ? "text-green-400" :
              "text-gray-300"
            }`}>
              {didRug ? "YOU RUGGED THE POT!" :
               wasRugged ? "POT WAS RUGGED!" :
               isWinner ? "YOU WON!" :
               "GAME OVER"}
            </h1>

            {/* Result Description */}
            <div className="mb-6">
              {didRug ? (
                <div className="text-red-200">
                  <p className="text-xl mb-2">Traitor Victory!</p>
                  <p>You successfully deceived everyone and stole the entire pot of {formatEther(potSize)} ETH!</p>
                </div>
              ) : wasRugged ? (
                <div className="text-red-200">
                  <p className="text-xl mb-2">The Traitor Won!</p>
                  <p>{ruggedBy === myPlayerId ? "You" : "A traitor"} rugged the pot of {formatEther(potSize)} ETH!</p>
                </div>
              ) : isWinner ? (
                <div className="text-green-200">
                  <p className="text-xl mb-2">Crew Victory!</p>
                  <p>You helped eliminate the traitor and earned your share of {formatEther(potSize)} ETH!</p>
                </div>
              ) : (
                <div className="text-gray-300">
                  <p className="text-xl mb-2">Better Luck Next Time!</p>
                  <p>{myRole === "traitor" ? "You were eliminated as the traitor." : "The crew failed to find the traitor."}</p>
                </div>
              )}
            </div>

            {/* Winners List */}
            {!wasRugged && winners.length > 0 && (
              <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">Winners</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {winners.map((winnerId, index) => (
                    <Badge key={winnerId} className="bg-green-600">
                      Winner {index + 1}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Pot Information */}
            <div className="mb-6 p-4 bg-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-2">Final Pot</h3>
              <div className="text-3xl font-bold text-yellow-400">
                {formatEther(potSize)} ETH
              </div>
              <p className="text-sm text-gray-300 mt-1">
                {wasRugged ? "Taken by the traitor" : 
                 winners.length > 0 ? `Split among ${winners.length} winner${winners.length !== 1 ? 's' : ''}` :
                 "No winners"}
              </p>
            </div>

            {/* Game Stats */}
            <div className="mb-6 text-sm text-gray-300">
              <p>Your Role: <span className={`font-bold ${myRole === "traitor" ? "text-red-400" : "text-blue-400"}`}>
                {myRole?.toUpperCase()}
              </span></p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <Button
                onClick={handlePlayAgain}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Play Again
              </Button>
              <Button
                onClick={handleHome}
                variant="outline"
                className="text-white border-white hover:bg-white hover:text-black"
              >
                <Home className="h-5 w-5 mr-2" />
                Home
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Game Summary */}
        <Card className="bg-gray-800 border-gray-700 mt-4">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-400">
              Thanks for playing SUS! Share your experience and invite friends for more rounds.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}