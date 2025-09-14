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
  baseBuilder: {
    allowedAddresses: ["0x276421D209124cE6c74F211AEE1cF6A1B5Ce2903"]
  },
  frame: {
    version: "1",
    name: "SUS",
    subtitle: "Social Deduction Game",
    description: "A multiplayer social deduction game where players bet and try to identify the Traitor among them. Work together to find the impostor, or be the one who takes it all!",
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
    ogDescription: "Play SUS - a multiplayer social deduction game where players bet and hunt for traitors. Winners split the prize, traitors can take it all!",
    ogImageUrl: `${ROOT_URL}/hero.png`,
    noindex: false, // Set to true during testing
    enableDeveloperMode: true,
    buttonTitle: "Play Game",
    postUrl: `${ROOT_URL}/api/share`,
  },
} as const;
