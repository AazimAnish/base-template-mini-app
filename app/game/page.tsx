"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/stores/gameStore";
import { RoleReveal } from "@/components/game/RoleReveal";
import { GamePlayground } from "@/components/game/GamePlayground";
import { VotingScreen } from "@/components/game/VotingScreen";
import { GameResults } from "@/components/game/GameResults";

export default function GamePage() {
  const router = useRouter();
  const { gameId, phase } = useGameStore();

  useEffect(() => {
    if (!gameId) {
      router.push("/");
      return;
    }
  }, [gameId, router]);

  if (!gameId) {
    return null;
  }

  switch (phase) {
    case "reveal":
      return <RoleReveal />;
    case "discussion":
      return <GamePlayground />;
    case "voting":
      return <VotingScreen />;
    case "ended":
      return <GameResults />;
    default:
      router.push("/lobby");
      return null;
  }
}