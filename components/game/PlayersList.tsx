"use client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/lib/stores/gameStore";
import { Crown, Skull } from "lucide-react";

interface PlayersListProps {
  showVoteButton?: boolean;
  onPlayerSelect?: (playerId: string) => void;
  selectedPlayer?: string;
}

export function PlayersList({ 
  showVoteButton = false, 
  onPlayerSelect,
  selectedPlayer 
}: PlayersListProps) {
  const { players, myPlayerId, isHost } = useGameStore();

  return (
    <div className="space-y-2">
      {players.map((player, index) => (
        <div
          key={player.id}
          className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
            player.isEliminated 
              ? "bg-gray-100 opacity-60" 
              : player.id === myPlayerId
              ? "bg-blue-50 border border-blue-200"
              : selectedPlayer === player.id
              ? "bg-red-50 border border-red-200"
              : "bg-gray-50 hover:bg-gray-100"
          } ${
            showVoteButton && !player.isEliminated && player.id !== myPlayerId 
              ? "cursor-pointer" 
              : ""
          }`}
          onClick={() => {
            if (showVoteButton && !player.isEliminated && player.id !== myPlayerId && onPlayerSelect) {
              onPlayerSelect(player.id);
            }
          }}
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
              {index === 0 && isHost && (
                <Crown className="h-4 w-4 text-yellow-500" />
              )}
              {player.isEliminated && (
                <Skull className="h-4 w-4 text-red-500" />
              )}
            </div>
            <p className="text-xs text-gray-600">
              {player.address ? 
                `${player.address.slice(0, 6)}...${player.address.slice(-4)}` : 
                "Connecting..."
              }
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {player.isEliminated ? (
              <Badge variant="destructive" className="bg-red-100 text-red-800">
                Eliminated
              </Badge>
            ) : (
              <Badge 
                variant={player.isReady ? "default" : "secondary"}
                className={player.isReady ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}
              >
                {player.isReady ? "Alive" : "Waiting"}
              </Badge>
            )}
            
            {showVoteButton && !player.isEliminated && player.id !== myPlayerId && (
              <Button
                size="sm"
                variant={selectedPlayer === player.id ? "destructive" : "outline"}
                className={`h-8 ${
                  selectedPlayer === player.id 
                    ? "bg-red-600 hover:bg-red-700 text-white" 
                    : "border-gray-300 hover:bg-gray-50 text-gray-700"
                }`}
              >
                {selectedPlayer === player.id ? "Selected" : "Vote"}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}