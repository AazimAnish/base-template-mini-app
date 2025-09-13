# SUS - Onchain Social Deduction

A multiplayer onchain social deduction game inspired by Among Us, built as a Farcaster Mini App on Base blockchain.

## Game Overview

SUS is a lightweight Among Us-style social deduction game where:

- **Players** join lobbies by staking ETH (custom amounts set by host)
- **Roles** are randomly assigned onchain: Crew or Imposter (1 Imposter per game)
- **Imposter** can "rug" (steal the entire pot) anytime to win instantly
- **Crew** can vote to eject suspects. If they eject the Imposter, they win and share the pot equally
- **Stake Amount**: Customizable by host (minimum 0.0001 ETH)
- **Players**: 3-10 per game with real economic incentives

## User Flow

1. **Landing** → Connect wallet → Create/Join lobby
2. **Lobby** → Stake ETH → Wait for minimum players → Start game
3. **Playground** → Social interaction → Rug (Imposter) or Call Vote (Crew)
4. **Voting** → 30-second voting period → Cast votes to eject suspected Imposter
5. **Game End** → Role reveal → Automatic winnings distribution to winners

## Tech Stack

- **Framework**: React + Next.js 15 + TypeScript
- **Package Manager**: pnpm
- **Blockchain**: Base Sepolia (production deployment ready)
- **Smart Contract**: Solidity with dynamic stake amounts and fair randomness
- **Wallet Integration**: Wagmi + OnchainKit + Coinbase Wallet
- **UI**: Tailwind CSS + shadcn/ui components (mobile-optimized)
- **Social Integration**: Farcaster Mini App with native sharing

## Setup Instructions

### Prerequisites

- Node.js 18+
- pnpm
- Farcaster account for testing

### Local Development

1. **Clone and install dependencies**:
   ```bash
   git clone <repo-url>
   cd sus-onchain-social-deduction
   pnpm install
   ```

2. **Environment variables** (create `.env.local`):
   ```bash
   NEXT_PUBLIC_URL=http://localhost:3000
   NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_coinbase_api_key
   # Optional: Neynar API for advanced features
   NEYNAR_API_KEY=your_neynar_api_key
   NEYNAR_CLIENT_ID=your_client_id
   ```

3. **Start development server**:
   ```bash
   pnpm dev
   ```

4. **Test in Warpcast**:
   - Open [Warpcast Mini App Developer Tools](https://warpcast.com/~/developers)
   - Enter `http://localhost:3000` in the Preview Tool
   - Click "Preview" to test the Mini App

### Smart Contract Deployment

1. **Deploy to Base Sepolia**:
   ```bash
   # Using Remix IDE
   1. Copy contracts/SUSGame.sol to Remix
   2. Compile with Solidity 0.8.19+
   3. Deploy to Base Sepolia network
   4. Update SUS_GAME_CONTRACT_ADDRESS in src/lib/susContract.ts
   ```

2. **Contract verification**:
   ```bash
   # On Basescan Sepolia
   npx hardhat verify --network base-sepolia <CONTRACT_ADDRESS>
   ```

### Production Deployment

1. **Deploy to Vercel**:
   ```bash
   # Set environment variables in Vercel dashboard
   NEXT_PUBLIC_URL=https://your-domain.vercel.app
   NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_api_key
   
   # Deploy
   pnpm run deploy:vercel
   ```

2. **Update Farcaster Mini App**:
   - Register at [Farcaster Developer Portal](https://warpcast.com/~/developers)
   - Submit Mini App with production URL
   - Include manifest.json for proper integration

## Game Mechanics

### Economics & Incentives

- **Dynamic Staking**: Host sets custom stake amounts (0.0001 ETH minimum)
- **Real Stakes**: Actual ETH at risk creates genuine tension and strategy
- **Winner Takes All**: Imposter gets entire pot if successful rug
- **Crew Sharing**: Surviving crew members split pot equally if they vote out Imposter
- **Gas Efficient**: Optimized contract design minimizes transaction costs

### Fair Gameplay

- **Verifiable Randomness**: Onchain role assignment using `block.prevrandao`
- **Transparent Rules**: All game mechanics enforced by smart contract
- **Private Roles**: Only you know your role - adds to social deduction element
- **Anti-Manipulation**: Host cannot influence role assignment or outcomes

### Win Conditions

1. **Imposter Victory**: Execute successful rug → Take entire pot (high risk, high reward)
2. **Crew Victory**: Vote out Imposter → Share pot equally among surviving crew
3. **Automatic Payouts**: Smart contract handles all fund distribution immediately

### Security & Trust

- **Trustless Gameplay**: Smart contract enforces all rules automatically
- **Secure Fund Management**: Stakes held in contract until game resolution
- **Immutable Votes**: Once cast, votes cannot be changed
- **No Admin Privileges**: Host cannot manipulate outcomes or access funds
- **Transparent State**: All game state verifiable on blockchain

## File Structure

```
src/
├── app/
│   ├── app.tsx              # Main app component
│   ├── page.tsx             # Next.js page
│   ├── layout.tsx           # App layout
│   └── providers.tsx        # React providers (Wagmi, OnchainKit)
├── components/
│   ├── SUSGame.tsx          # Main game orchestrator
│   ├── Landing.tsx          # Landing screen
│   ├── Lobby.tsx            # Lobby screen
│   ├── Playground.tsx       # Game playground
│   ├── Vote.tsx             # Voting screen
│   ├── GameEnd.tsx          # End game/role reveal
│   └── ui/                  # shadcn/ui components
├── lib/
│   ├── susContract.ts       # Smart contract ABI & utils
│   ├── constants.ts         # App constants
│   └── utils.ts             # Utility functions
contracts/
└── SUSGame.sol              # Main game smart contract
public/
├── manifest.json            # Mini App manifest
├── icon.png                 # App icon
└── splash.png               # Splash screen
```

## Development Notes

### Current Features

- **Real-time State**: Game state polling for live updates
- **Mobile Optimized**: Responsive design for phone and desktop
- **Social Sharing**: Integrated Farcaster sharing for results
- **Production Ready**: Deployed smart contract on Base Sepolia

### Future Enhancements

- **Enhanced Social Features**: In-game chat and voice integration
- **Advanced Gameplay**: Multiple imposters, special crew roles, power-ups
- **Tournament System**: Leaderboards, seasons, and competitive play
- **NFT Integration**: Collectible badges and achievements for wins
- **Multi-chain Support**: Deployment to additional L2s
- **Community Features**: Clans, friends lists, and reputation systems

## Testing

### Production Testing Checklist

- [x] Wallet connection (Coinbase Wallet, MetaMask) 
- [x] Lobby creation with custom stake amounts
- [x] Real ETH staking and fund management
- [x] Random role assignment and game start
- [x] Imposter rug functionality with instant payouts
- [x] Voting mechanism with 30-second timer
- [x] Automatic fund distribution to winners
- [x] Farcaster sharing integration
- [x] Mobile-responsive design
- [x] Network detection and user guidance

### Tested & Verified

- ✅ Smart contract deployed and verified on Base Sepolia
- ✅ All game mechanics tested with real transactions
- ✅ UI/UX optimized for mobile Farcaster experience
- ✅ Error handling and edge cases covered

## Production Status

- **Smart Contract**: ✅ Deployed on Base Sepolia (`0x45D8421807A9C88dac321aE0245540dA579d5703`)
- **Frontend**: ✅ Production-ready with real blockchain integration
- **Farcaster Integration**: ✅ Full Mini App compatibility with sharing
- **Testing**: ✅ Comprehensive testing completed on Base Sepolia testnet

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes following existing patterns
4. Test thoroughly on Base Sepolia
5. Submit pull request with detailed description

## License

MIT License - see LICENSE file for details

---

**🚀 Production-Ready Onchain Social Deduction Game**

SUS represents a new category of social gaming where real economic stakes drive authentic player behavior. Built as a Farcaster Mini App on Base, it combines the viral mechanics of social deduction with the transparency and fairness of blockchain technology.

**Key Differentiators:**
- Real money gameplay creates genuine tension and strategy
- Farcaster integration enables social discovery and viral sharing  
- Base blockchain provides fast, cheap transactions for micro-stakes
- Completely trustless - no administrators or house edge
- Mobile-first design optimized for social media sharing
