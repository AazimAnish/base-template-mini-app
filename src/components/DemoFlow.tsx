"use client";

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/Dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/RadioGroup";
import { ChatInterface } from "~/components/ChatInterface";
import { Share } from "lucide-react";

type DemoStep = "landing" | "createLobby" | "joinLobby" | "roleReveal" | "playground" | "rugAction" | "vote" | "gameEnd";

interface Player {
  address: string;
  index: number;
  isAlive: boolean;
  role?: "CREW" | "IMPOSTER";
}

export function DemoFlow() {
  const [currentStep, setCurrentStep] = useState<DemoStep>("landing");
  const [stakeAmount, setStakeAmount] = useState("0.0001");
  const [joinLobbyId, setJoinLobbyId] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showRugDialog, setShowRugDialog] = useState(false);
  const [showVoteDialog, setShowVoteDialog] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [hasVoted, setHasVoted] = useState(false);
  const [votedFor, setVotedFor] = useState<number | undefined>();
  const [showRoleReveal, setShowRoleReveal] = useState(false);
  const [showRugSuccess, setShowRugSuccess] = useState(false);
  const [showVoteResult, setShowVoteResult] = useState(false);

  // Demo data
  const demoPlayers: Player[] = [
    { address: "0x9999...1111 (Host)", index: 1, isAlive: true, role: "CREW" },
    { address: "0xabcd...ef01", index: 2, isAlive: true, role: "CREW" },
    { address: "0x1234...5678 (You)", index: 3, isAlive: true, role: "IMPOSTER" }
  ];

  const pot = (parseFloat(stakeAmount) * 3).toString();

  const handleCreateLobby = () => {
    setCurrentStep("createLobby");
    setShowCreateDialog(false);
    
    // Auto-progress to join lobby after 2 seconds
    setTimeout(() => {
      setCurrentStep("joinLobby");
    }, 2000);
  };

  const handleJoinLobby = () => {
    setCurrentStep("joinLobby");
    setShowJoinDialog(false);
    
    // Auto-progress to role reveal after 2 seconds
    setTimeout(() => {
      setCurrentStep("roleReveal");
      setShowRoleReveal(true);
    }, 2000);
  };

  const handleJoinLobbyFromLanding = () => {
    setCurrentStep("joinLobby");
    
    // Auto-progress to role reveal after 2 seconds
    setTimeout(() => {
      setCurrentStep("roleReveal");
      setShowRoleReveal(true);
    }, 2000);
  };

  const handleRoleRevealComplete = () => {
    setShowRoleReveal(false);
    setCurrentStep("playground");
  };

  const handleRug = () => {
    setShowRugDialog(false);
    setShowRugSuccess(true);
    
    // Auto-progress to game end after 3 seconds
    setTimeout(() => {
      setShowRugSuccess(false);
      setCurrentStep("gameEnd");
    }, 3000);
  };

  const handleStartVote = () => {
    setShowVoteDialog(false);
    setCurrentStep("vote");
  };

  const handleVote = () => {
    if (selectedPlayer) {
      setHasVoted(true);
      setVotedFor(parseInt(selectedPlayer));
      setShowVoteResult(true);
      
      // Auto-progress to game end after 3 seconds
      setTimeout(() => {
        setShowVoteResult(false);
        setCurrentStep("gameEnd");
      }, 3000);
    }
  };

  const handlePlayAgain = () => {
    setCurrentStep("landing");
    setHasVoted(false);
    setVotedFor(undefined);
    setSelectedPlayer("");
    setShowRoleReveal(false);
    setShowRugSuccess(false);
    setShowVoteResult(false);
  };

  const handleShareResult = () => {
    const text = "I played SUS and the imposter won! 😈";
    const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(window.location.origin)}`;
    window.open(url, "_blank");
  };

  const renderLanding = () => (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-md w-full">
        <h1 className="text-6xl font-bold text-blue-500 mb-8">SUS</h1>
        
        <div className="space-y-4">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700">
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
                </div>
                <Button 
                  onClick={handleCreateLobby} 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Create Lobby
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            onClick={handleJoinLobbyFromLanding}
            variant="outline" 
            className="w-full h-12 text-lg border-gray-600 text-white hover:bg-gray-800"
          >
            Join Lobby
          </Button>
        </div>

        <div className="text-sm text-gray-400 space-y-2">
          <p>Welcome to SUS - Onchain Social Deduction</p>
          <p>Host sets stake amount • Min 3 players • Max 10 players</p>
          <p className="text-green-400 text-xs">🎮 Demo Mode - Follow the guided flow!</p>
        </div>
      </div>
    </div>
  );

  const renderCreateLobby = () => (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md w-full">
        <h1 className="text-4xl font-bold text-blue-500 mb-4">SUS</h1>
        <h2 className="text-xl font-semibold">Creating Lobby...</h2>
        
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-300">Setting up lobby with {stakeAmount} ETH stake...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderJoinLobby = () => (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md w-full">
        <h1 className="text-4xl font-bold text-blue-500 mb-4">SUS</h1>
        <h2 className="text-xl font-semibold">Joining Lobby...</h2>
        
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
              <p className="text-gray-300">Connecting to lobby...</p>
              <p className="text-xs text-gray-500">This will auto-progress in 2 seconds...</p>
            </div>
          </CardContent>
        </Card>

        <Button 
          onClick={() => {
            setCurrentStep("roleReveal");
            setShowRoleReveal(true);
          }}
          variant="outline" 
          className="text-sm"
        >
          Continue Manually
        </Button>
      </div>
    </div>
  );

  const renderRoleReveal = () => (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md w-full">
        <h1 className="text-4xl font-bold text-blue-500 mb-4">SUS</h1>
        <h2 className="text-xl font-semibold">Role Assignment</h2>
        
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-6xl mb-4">🎭</div>
              <p className="text-gray-300 mb-4">Your role is being assigned...</p>
              <div className="animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-3/4 mx-auto"></div>
              </div>
              <p className="text-xs text-gray-500">This will auto-progress in 2 seconds...</p>
            </div>
          </CardContent>
        </Card>

        <Button 
          onClick={() => {
            setShowRoleReveal(true);
          }}
          variant="outline" 
          className="text-sm"
        >
          Show Role Now
        </Button>

        {showRoleReveal && (
          <Card className="bg-red-900/30 border-red-700">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="text-6xl">😈</div>
                <h3 className="text-2xl font-bold text-red-400">YOU ARE THE IMPOSTER!</h3>
                <p className="text-gray-300">Your mission: Steal the pot without getting caught!</p>
                <Button 
                  onClick={handleRoleRevealComplete}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  Continue to Game
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const renderPlayground = () => (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-500 mb-2">SUS</h1>
          <h2 className="text-xl font-semibold">Playground</h2>
        </div>

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <div className="inline-block px-4 py-2 rounded-full text-sm font-semibold bg-red-600 text-white">
                You are the IMPOSTER
              </div>
              <p className="text-lg font-semibold">Pot: {pot} ETH</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-0">
            <ChatInterface 
              players={demoPlayers}
              userRole="IMPOSTER"
              onSendMessage={(message) => console.log("Message sent:", message)}
            />
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Dialog open={showRugDialog} onOpenChange={setShowRugDialog}>
            <DialogTrigger asChild>
              <Button className="w-full h-12 text-lg bg-red-600 hover:bg-red-700">
                🏃 RUG (Steal the pot!)
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-700 text-white">
              <DialogHeader>
                <DialogTitle className="text-red-400">Execute Rug</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <p className="text-sm text-gray-300">
                  You are about to steal the entire pot of {pot} ETH!
                </p>
                <p className="text-xs text-gray-400">
                  • This will end the game immediately
                </p>
                <p className="text-xs text-gray-400">
                  • You will win all the funds
                </p>
                <Button 
                  onClick={handleRug}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  Confirm Rug
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showVoteDialog} onOpenChange={setShowVoteDialog}>
            <DialogTrigger asChild>
              <Button className="w-full h-12 text-lg bg-yellow-600 hover:bg-yellow-700">
                🗳️ Call Vote
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-700 text-white">
              <DialogHeader>
                <DialogTitle>Start Voting</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <p className="text-sm text-gray-300">
                  Call an emergency meeting to vote out a suspected imposter.
                </p>
                <Button 
                  onClick={handleStartVote}
                  className="w-full bg-yellow-600 hover:bg-yellow-700"
                >
                  Start Vote
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400 mb-2">Players (3)</p>
                <div className="space-y-2">
                  {demoPlayers.map((player) => (
                    <div key={player.address} className="flex items-center justify-between bg-gray-800 p-3 rounded">
                      <span className="font-mono text-sm">{player.address}</span>
                      {player.address === "0x1234...5678 (You)" && (
                        <span className="text-xs text-red-400">You (IMPOSTER)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>🎭 You are the IMPOSTER!</p>
          <p>• Blend in with the crew</p>
          <p>• Rug the pot anytime to win</p>
          <p>• Avoid getting voted out</p>
        </div>
      </div>
    </div>
  );

  const renderRugSuccess = () => (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md w-full">
        <Card className="bg-red-900/30 border-red-700">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-6xl">💰</div>
              <h2 className="text-3xl font-bold text-red-400">RUG SUCCESSFUL!</h2>
              <p className="text-lg text-gray-300">You stole the entire pot!</p>
              <p className="text-2xl font-bold text-green-400">+{pot} ETH</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderVote = () => (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-500 mb-2">SUS</h1>
          <h2 className="text-xl font-semibold">Emergency Meeting</h2>
        </div>

        <Card className="border-2 border-yellow-500 bg-yellow-900/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-400">0:30</div>
              <p className="text-sm text-gray-400 mt-2">Time left to vote</p>
            </div>
          </CardContent>
        </Card>

        {!hasVoted ? (
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Who is the imposter?</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedPlayer} onValueChange={setSelectedPlayer}>
                {demoPlayers.map((player) => (
                  <div key={player.address} className="flex items-center space-x-2 p-3 bg-gray-800 rounded hover:bg-gray-700">
                    <RadioGroupItem 
                      value={player.index.toString()} 
                      id={player.index.toString()}
                    />
                    <Label 
                      htmlFor={player.index.toString()} 
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm">{player.address}</span>
                        {player.address === "0x1234...5678 (You)" && (
                          <span className="text-xs text-blue-400">You</span>
                        )}
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-green-900/30 border-green-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-green-400 font-semibold">✓ Vote Submitted</p>
                <p className="text-sm text-gray-400 mt-1">
                  You voted for: {demoPlayers.find(p => p.index === votedFor)?.address}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {!hasVoted && (
            <Button 
              onClick={handleVote}
              disabled={!selectedPlayer}
              className="w-full h-12 text-lg bg-red-600 hover:bg-red-700 disabled:bg-gray-700"
            >
              {selectedPlayer ? "Submit Vote" : "Select a player to vote"}
            </Button>
          )}
        </div>

        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>🗳️ Vote for the player you think is the imposter</p>
          <p>• Player with most votes gets ejected</p>
          <p>• If imposter is ejected, crew wins</p>
        </div>
      </div>
    </div>
  );

  const renderVoteResult = () => (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md w-full">
        <Card className="bg-yellow-900/30 border-yellow-700">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-6xl">🗳️</div>
              <h2 className="text-2xl font-bold text-yellow-400">Vote Complete!</h2>
              <p className="text-gray-300">The crew voted, but the imposter remains...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderGameEnd = () => (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-500 mb-4">SUS</h1>
        </div>

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="inline-block px-4 py-2 rounded-full text-lg font-semibold bg-red-600 text-white">
                You are IMPOSTER
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-500 bg-red-900/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-6xl">😈</div>
              <h2 className="text-3xl font-bold text-red-400">IMPOSTER WON!</h2>
              <p className="text-lg text-gray-300">You successfully stole the pot!</p>
              <div className="bg-green-900/50 p-4 rounded-lg">
                <p className="text-green-400 font-semibold text-xl">
                  💰 You won {pot} ETH!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-2">The Imposter was:</p>
                <div className="bg-red-900/30 p-3 rounded border border-red-700">
                  <span className="font-mono text-sm">0x1234...5678 (You)</span>
                  <span className="text-red-400 ml-2">👹</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button 
            onClick={handleShareResult}
            className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 flex items-center justify-center space-x-2"
          >
            <Share className="w-5 h-5" />
            <span>Share on Farcaster</span>
          </Button>

          <Button 
            onClick={handlePlayAgain}
            variant="outline" 
            className="w-full h-12 text-lg border-gray-600 text-white hover:bg-gray-800"
          >
            Play Again
          </Button>
        </div>

        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>Game completed • Total players: 3</p>
          <p>🏃 The imposter rugged and took all funds</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {currentStep === "landing" && renderLanding()}
      {currentStep === "createLobby" && renderCreateLobby()}
      {currentStep === "joinLobby" && renderJoinLobby()}
      {currentStep === "roleReveal" && renderRoleReveal()}
      {currentStep === "playground" && renderPlayground()}
      {currentStep === "rugAction" && renderRugSuccess()}
      {currentStep === "vote" && renderVote()}
      {currentStep === "gameEnd" && renderGameEnd()}
      
      {showRugSuccess && renderRugSuccess()}
      {showVoteResult && renderVoteResult()}
    </div>
  );
}
