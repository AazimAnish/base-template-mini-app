const ROOT_URL = process.env.NEXT_PUBLIC_URL || process.env.VERCEL_URL;

/**
 * MiniApp configuration object. Must follow the Farcaster MiniApp specification.
 *
 * @see {@link https://miniapps.farcaster.xyz/docs/guides/publishing}
 */
export const minikitConfig = {
  accountAssociation: {
    header: "",
    payload: "",
    signature: "",
  },
  frame: {
    version: "1",
    name: "SUS",
    subtitle: "Social Deduction Game",
    description: "A multiplayer social deduction game where players stake ETH and try to identify the Traitor among them. Will you work together to find the impostor, or will you be the one who rugs the pot?",
    screenshotUrls: [
      `${ROOT_URL}/screenshot.png`,
    ],
    iconUrl: `${ROOT_URL}/icon.png`,
    splashImageUrl: `${ROOT_URL}/splash.png`,
    splashBackgroundColor: "#7f1d1d", // red-900
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "game",
    tags: ["game", "social", "ethereum", "multiplayer", "deduction"],
    heroImageUrl: `${ROOT_URL}/hero.png`,
    tagline: "Trust No One. Stake Everything.",
    ogTitle: "SUS - Social Deduction Game on Base",
    ogDescription: "Play SUS - a multiplayer social deduction game where players stake ETH and hunt for traitors. Winners split the pot, traitors can rug it all!",
    ogImageUrl: `${ROOT_URL}/hero.png`,
  },
} as const;
