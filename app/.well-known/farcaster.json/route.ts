import { NextResponse } from 'next/server';

export async function GET() {
  const farcasterManifest = {
    accountAssociation: {
      header: process.env.FARCASTER_HEADER || "",
      payload: process.env.FARCASTER_PAYLOAD || "",
      signature: process.env.FARCASTER_SIGNATURE || "",
    },
    frame: {
      version: "1",
      name: "SUS",
      subtitle: "Social Deduction Game",
      description: "A multiplayer social deduction game where players bet and try to identify the Traitor among them. Work together to find the impostor, or be the one who takes it all!",
      homeUrl: process.env.NEXT_PUBLIC_URL || "https://susonbase.vercel.app/",
      iconUrl: `${process.env.NEXT_PUBLIC_URL || "https://susonbase.vercel.app"}/icon.png`,
      splashImageUrl: `${process.env.NEXT_PUBLIC_URL || "https://susonbase.vercel.app"}/icon.png`,
      splashBackgroundColor: "#7f1d1d",
      webhookUrl: `${process.env.NEXT_PUBLIC_URL || "https://susonbase.vercel.app"}/api/webhook`,
      screenshotUrls: [
        `${process.env.NEXT_PUBLIC_URL || "https://susonbase.vercel.app"}/icon.png`,
      ],
      heroImageUrl: `${process.env.NEXT_PUBLIC_URL || "https://susonbase.vercel.app"}/icon.png`,
      primaryCategory: "games",
      tags: ["game", "social", "ethereum", "multiplayer", "deduction"],
      tagline: "Trust No One. Stake Everything.",
      ogTitle: "SUS - Social Deduction Game on Base",
      ogDescription: "Play SUS - a multiplayer social deduction game where players bet and hunt for traitors. Winners split the prize, traitors can take it all!",
      ogImageUrl: `${process.env.NEXT_PUBLIC_URL || "https://susonbase.vercel.app"}/icon.png`,
      noindex: false,
      enableDeveloperMode: true,
      buttonTitle: "Play Game",
      postUrl: `${process.env.NEXT_PUBLIC_URL || "https://susonbase.vercel.app"}/api/share`,
    }
  };

  return NextResponse.json(farcasterManifest, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
}