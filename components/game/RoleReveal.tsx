"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/lib/stores/gameStore";
import { Shield, Eye, EyeOff } from "lucide-react";

export function RoleReveal() {
  const { myRole, setPhase } = useGameStore();
  const [revealed, setRevealed] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Simulate role assignment - in real app this would come from server
    const roles = ["crew", "traitor"];
    const randomRole = roles[Math.random() < 0.2 ? 1 : 0]; // 20% chance traitor
    useGameStore.getState().setMyRole(randomRole as "crew" | "traitor");
  }, []);

  useEffect(() => {
    if (revealed && countdown > 0) {
      const timer = setTimeout(() => {
        if (countdown === 1) {
          setPhase("discussion");
        } else {
          setCountdown(countdown - 1);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [revealed, countdown, setPhase]);

  const handleReveal = () => {
    setRevealed(true);
  };

  if (!myRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-950 via-black to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="h-16 w-16 text-white mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold text-white mb-2">Assigning Roles...</h2>
          <p className="text-gray-300">Please wait while roles are distributed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-black to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {!revealed ? (
          <Card className="bg-gray-800 border-gray-700 text-center">
            <CardContent className="p-8">
              <div className="mb-6">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                  <EyeOff className="h-12 w-12 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Your Role Awaits</h2>
                <p className="text-gray-300">
                  Click to reveal your secret role. Remember - trust no one.
                </p>
              </div>
              
              <Button
                onClick={handleReveal}
                size="lg"
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                <Eye className="h-5 w-5 mr-2" />
                Reveal My Role
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className={`border-4 text-center ${
            myRole === "traitor" 
              ? "bg-red-900/50 border-red-500 animate-pulse" 
              : "bg-blue-900/50 border-blue-500"
          }`}>
            <CardContent className="p-8">
              <div className="mb-6">
                <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  myRole === "traitor" ? "bg-red-600" : "bg-blue-600"
                }`}>
                  <Shield className="h-12 w-12 text-white" />
                </div>
                
                <h2 className={`text-3xl font-bold mb-2 ${
                  myRole === "traitor" ? "text-red-400" : "text-blue-400"
                }`}>
                  You are {myRole === "traitor" ? "THE TRAITOR" : "CREW"}
                </h2>
                
                <div className={`p-4 rounded-lg mb-4 ${
                  myRole === "traitor" ? "bg-red-900/30" : "bg-blue-900/30"
                }`}>
                  {myRole === "traitor" ? (
                    <div className="text-red-200">
                      <p className="font-semibold mb-2">Your Mission:</p>
                      <ul className="text-sm space-y-1">
                        <li>• Deceive the crew and survive voting rounds</li>
                        <li>• OR click &quot;RUG POT&quot; at any time to steal everything</li>
                        <li>• Act innocent - you win if they don&apos;t eliminate you</li>
                      </ul>
                    </div>
                  ) : (
                    <div className="text-blue-200">
                      <p className="font-semibold mb-2">Your Mission:</p>
                      <ul className="text-sm space-y-1">
                        <li>• Find and eliminate the Traitor through discussion</li>
                        <li>• Vote wisely - majority rules each round</li>
                        <li>• Work together but trust no one completely</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-gray-300 mb-2">Game starting in:</p>
                <div className="text-4xl font-bold text-white">
                  {countdown}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}