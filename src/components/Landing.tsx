"use client";

import { useState } from "react";
import { Button } from "~/components/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/Dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useAccount, useConnect, useDisconnect, useChainId } from "wagmi";
import { Copy, Check, AlertTriangle } from "lucide-react";
import { baseSepolia } from "wagmi/chains";

interface LandingProps {
  onCreateLobby: (stakeAmount: string) => void;
  onJoinLobby: (lobbyId: string) => void;
  isCreatingLobby?: boolean;
  demoMode?: boolean;
  onToggleDemoMode?: () => void;
}

export function Landing({ onCreateLobby, onJoinLobby, isCreatingLobby = false, demoMode = true, onToggleDemoMode }: LandingProps) {
  const [joinLobbyId, setJoinLobbyId] = useState("");
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [stakeAmount, setStakeAmount] = useState("0.0001");
  const [copied, setCopied] = useState(false);
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  
  const isCorrectNetwork = chainId === baseSepolia.id;

  const handleConnectWallet = () => {
    const coinbaseConnector = connectors.find(c => c.name.toLowerCase().includes('coinbase'));
    if (coinbaseConnector) {
      connect({ connector: coinbaseConnector });
    }
  };

  const handleJoinLobby = () => {
    if (demoMode) {
      // Demo mode - use demo lobby ID
      onJoinLobby("demo_lobby_123");
      setShowJoinDialog(false);
      setJoinLobbyId("");
    } else if (joinLobbyId.trim()) {
      onJoinLobby(joinLobbyId.trim());
      setShowJoinDialog(false);
      setJoinLobbyId("");
    }
  };

  const handleCreateLobby = () => {
    if (stakeAmount && parseFloat(stakeAmount) > 0) {
      onCreateLobby(stakeAmount);
      setShowCreateDialog(false);
    }
  };

  const handleDisconnectWallet = () => {
    disconnect();
    setShowDisconnectDialog(false);
  };

  const handleCopyAddress = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy address:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-md w-full">
        {/* Logo */}
        <h1 className="text-6xl font-bold text-blue-500 mb-8">SUS</h1>
        
        {/* Main buttons */}
        <div className="space-y-4">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button 
                className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700"
                disabled={demoMode ? false : (!isConnected || !isCorrectNetwork)}
              >
                Start Lobby
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-700 text-white">
              <DialogHeader>
                <DialogTitle>Create New Lobby</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="stakeAmount">Stake Amount (ETH)</Label>
                  <Input
                    id="stakeAmount"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="0.0001"
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    All players must stake this amount to join
                  </p>
                </div>
                <Button 
                  onClick={handleCreateLobby} 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={!stakeAmount || parseFloat(stakeAmount) <= 0 || isCreatingLobby}
                >
                  {isCreatingLobby ? "Creating Lobby..." : "Create Lobby"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full h-12 text-lg border-gray-600 text-white hover:bg-gray-800"
                disabled={demoMode ? false : (!isConnected || !isCorrectNetwork)}
              >
                Join Lobby
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-700 text-white">
              <DialogHeader>
                <DialogTitle>Join Lobby</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="lobbyId">Lobby ID</Label>
                  <Input
                    id="lobbyId"
                    value={joinLobbyId}
                    onChange={(e) => setJoinLobbyId(e.target.value)}
                    placeholder="Enter lobby ID"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                <Button 
                  onClick={handleJoinLobby} 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={!joinLobbyId.trim()}
                >
                  Join
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Connect wallet button - hidden in demo mode */}
          {!demoMode && !isConnected && (
            <Button 
              onClick={handleConnectWallet}
              variant="outline" 
              className="w-full h-12 text-lg border-gray-600 text-white hover:bg-gray-800"
            >
              Connect Wallet
            </Button>
          )}

          {/* Network warning - hidden in demo mode */}
          {!demoMode && isConnected && !isCorrectNetwork && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 space-y-3">
              <div className="flex items-center space-x-2 text-red-400">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-semibold">Wrong Network!</span>
              </div>
              <p className="text-sm text-red-300">
                You're connected to the wrong network. Please switch to <strong>Base Sepolia Testnet</strong>.
              </p>
              <div className="text-xs text-red-200 space-y-1">
                <p>• Network: Base Sepolia</p>
                <p>• Chain ID: 84532</p>
                <p>• RPC: https://sepolia.base.org</p>
              </div>
              <p className="text-xs text-yellow-300">
                💡 Need testnet ETH? Visit: <br/>
                <a href="https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="underline hover:text-yellow-200">
                  Base Sepolia Faucet
                </a>
              </p>
            </div>
          )}

          {/* Wallet status and disconnect - hidden in demo mode */}
          {!demoMode && isConnected && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <p className="text-sm text-gray-400">
                  Connected: <span className="font-mono text-white">{address}</span>
                </p>
                <button
                  onClick={handleCopyAddress}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                  title={copied ? "Copied!" : "Copy address"}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400 hover:text-white" />
                  )}
                </button>
              </div>
              <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full text-sm border-gray-600 text-white hover:bg-gray-800 py-2"
                  >
                    Disconnect Wallet
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-gray-700 text-white">
                  <DialogHeader>
                    <DialogTitle>Disconnect Wallet</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <p className="text-sm text-gray-300">
                      Are you sure you want to disconnect your wallet? This will end any active game session.
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleDisconnectWallet}
                        className="flex-1 bg-red-600 hover:bg-red-700"
                      >
                        Disconnect
                      </Button>
                      <Button
                        onClick={() => setShowDisconnectDialog(false)}
                        variant="outline"
                        className="flex-1 border-gray-600 text-white hover:bg-gray-800"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-sm text-gray-400 space-y-2 mt-8">
          <p>Welcome to SUS - Onchain Social Deduction</p>
          <p>Host sets stake amount • Min 3 players • Max 10 players</p>
          {demoMode ? (
            <p className="text-green-400 text-xs">
              🎮 Demo Mode - No wallet required!
            </p>
          ) : (
            <>
              <p className="text-blue-400 text-xs">
                🌐 Base Sepolia Testnet
              </p>
              {!isConnected && (
                <p className="text-yellow-400 text-xs mt-2">
                  ⚠️ Connect your wallet to start playing
                </p>
              )}
            </>
          )}
          
          {/* Demo Mode Toggle */}
          {onToggleDemoMode && (
            <button
              onClick={onToggleDemoMode}
              className="text-xs text-gray-500 hover:text-gray-300 underline mt-4"
            >
              {demoMode ? "Switch to Production Mode" : "Switch to Demo Mode"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}