export const APP_URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
export const APP_NAME = "SUS - Onchain Social Deduction";
export const APP_DESCRIPTION = "A multiplayer onchain social deduction game inspired by Among Us";
export const APP_PRIMARY_CATEGORY = "games";
export const APP_TAGS = ["game", "social", "deduction", "onchain", "multiplayer"];
export const APP_ICON_URL = `${APP_URL}/icon.png`;
export const APP_OG_IMAGE_URL = `${APP_URL}/api/opengraph-image`;
export const APP_SPLASH_URL = `${APP_URL}/splash.png`;
export const APP_SPLASH_BACKGROUND_COLOR = "#000000";
export const APP_BUTTON_TEXT = "Play SUS";
export const APP_WEBHOOK_URL = process.env.NEYNAR_API_KEY && process.env.NEYNAR_CLIENT_ID 
    ? `https://api.neynar.com/f/app/${process.env.NEYNAR_CLIENT_ID}/event`
    : `${APP_URL}/api/webhook`;
export const USE_WALLET = true;
