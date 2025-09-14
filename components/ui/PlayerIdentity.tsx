'use client';

import {
  Address,
  Avatar,
  Badge,
  Identity,
  Name,
} from '@coinbase/onchainkit/identity';
import { cn } from '@/lib/utils';
import { Crown } from 'lucide-react';
import { useMiniApp } from '@/lib/miniapp/hooks';

interface PlayerIdentityProps {
  address: `0x${string}`;
  isCurrentPlayer?: boolean;
  isHost?: boolean;
  isEliminated?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PlayerIdentity({ 
  address, 
  isCurrentPlayer = false, 
  isHost = false, 
  isEliminated = false,
  className,
  size = 'md'
}: PlayerIdentityProps) {
  const { userContext } = useMiniApp();
  
  const sizeConfig = {
    sm: { avatar: 'h-6 w-6', name: 'text-sm', address: 'text-xs' },
    md: { avatar: 'h-8 w-8', name: 'text-base', address: 'text-sm' },
    lg: { avatar: 'h-12 w-12', name: 'text-lg', address: 'text-base' }
  };

  const config = sizeConfig[size];

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-xl",
      isCurrentPlayer && "bg-blue-50 border border-blue-200",
      isEliminated && "opacity-50 grayscale",
      !isCurrentPlayer && !isEliminated && "bg-gray-50",
      className
    )}>
      <Identity
        address={address}
        className="flex items-center gap-2"
        hasCopyAddressOnClick={false}
      >
        <div className="relative">
          <Avatar 
            address={address}
            className={cn(config.avatar, "border border-gray-200")}
            defaultComponent={
              <div className={cn(config.avatar, "bg-gray-200 rounded-full flex items-center justify-center")}>
                <span className="text-gray-600 font-medium">
                  {address.slice(2, 4).toUpperCase()}
                </span>
              </div>
            }
          />
          {isHost && (
            <Crown className="h-3 w-3 text-yellow-500 absolute -top-1 -right-1" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Name
              address={address}
              className={cn(config.name, "font-medium text-black truncate")}
            />
            
            {isCurrentPlayer && (
              <span className="text-blue-600 text-xs font-medium">(You)</span>
            )}
            
            {/* Show Farcaster username if available */}
            {userContext && address.toLowerCase() === userContext.address?.toLowerCase() && (
              <span className="text-purple-600 text-xs font-medium">
                @{userContext.username}
              </span>
            )}
          </div>
          
          <Address
            address={address}
            className={cn(config.address, "text-gray-600 truncate")}
            isSliced={true}
          />
          
          {/* Base badges and attestations */}
          <div className="flex items-center gap-1 mt-1">
            <Badge
              address={address}
              className="text-xs"
            />
          </div>
        </div>
      </Identity>
      
      {/* Player status indicator */}
      <div className="flex flex-col items-end gap-1">
        {isEliminated && (
          <span className="text-xs text-red-600 font-medium">Eliminated</span>
        )}
        {isHost && (
          <span className="text-xs text-yellow-600 font-medium">Host</span>
        )}
        
        {/* Connection status dot */}
        <div className={cn(
          "w-2 h-2 rounded-full",
          isEliminated ? "bg-red-500" : "bg-green-500"
        )} />
      </div>
    </div>
  );
}

interface PlayerListProps {
  players: Array<{
    address: `0x${string}`;
    isEliminated?: boolean;
  }>;
  currentPlayerAddress?: `0x${string}`;
  hostAddress?: `0x${string}`;
  maxPlayers: number;
  className?: string;
}

export function PlayerList({ 
  players, 
  currentPlayerAddress, 
  hostAddress, 
  maxPlayers,
  className 
}: PlayerListProps) {
  const emptySlots = Math.max(0, maxPlayers - players.length);

  return (
    <div className={cn("space-y-2", className)}>
      {players.map((player) => (
        <PlayerIdentity
          key={player.address}
          address={player.address}
          isCurrentPlayer={player.address === currentPlayerAddress}
          isHost={player.address === hostAddress}
          isEliminated={player.isEliminated}
        />
      ))}
      
      {/* Empty slots */}
      {Array.from({ length: emptySlots }).map((_, index) => (
        <div
          key={`empty-${index}`}
          className="flex items-center gap-3 p-3 rounded-xl bg-white border-2 border-dashed border-gray-300"
        >
          <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-gray-400 text-sm">?</span>
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-500">Waiting for player...</p>
            <p className="text-xs text-gray-400">Empty slot</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-gray-300" />
        </div>
      ))}
    </div>
  );
}