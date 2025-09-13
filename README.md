# SUS - Social Deduction Game on Base

A multiplayer social deduction game built as a Base Mini App where players stake ETH and try to identify the Traitor among them.

## 🎮 Game Overview

**SUS** is a high-stakes social deduction game where:
- Players stake real ETH to join games
- 1 player is secretly assigned as the Traitor
- Crew members win by eliminating the Traitor through voting
- Traitors win by surviving all rounds OR by rugging the entire pot
- Winners split the ETH pot automatically via smart contracts

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (Note: Hardhat doesn't support Node 23+ yet)
- Bun package manager
- Base wallet or compatible Web3 wallet

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd sus
   bun install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Fill in your environment variables (see Environment Setup below)
   ```

3. **Compile smart contracts:**
   ```bash
   bun run compile
   ```

4. **Run development server:**
   ```bash
   bun run dev
   ```

Visit `http://localhost:3000` to see the app!

## 🔧 Environment Setup

### Required Environment Variables

Create a `.env` file with the following variables:

```env
# Base Mini App Configuration
NEXT_PUBLIC_ONCHAINKIT_API_KEY="your_onchainkit_api_key"
NEXT_PUBLIC_URL="http://localhost:3000"

# Blockchain Configuration (for contract deployment)
PRIVATE_KEY="your_wallet_private_key_for_deployment"
BASESCAN_API_KEY="your_basescan_api_key"

# Real-time Features (Socket.io)
NEXT_PUBLIC_SOCKET_URL="ws://localhost:3001"

# Farcaster Integration
FARCASTER_DEVELOPER_MNEMONIC="your_farcaster_dev_mnemonic"
FARCASTER_DEVELOPER_FID="your_farcaster_developer_fid"
```

### Getting API Keys

1. **OnchainKit API Key**: Get from [Base/Coinbase Developer Portal](https://www.coinbase.com/developer-platform)
2. **BaseScan API Key**: Get from [BaseScan](https://basescan.org/apis)
3. **Farcaster Developer Account**: Create at [Farcaster Developer Portal](https://developers.farcaster.xyz/)

## 📱 Base Mini App Integration

This app is built as a Base Mini App using:
- **OnchainKit**: For Web3 wallet integration and Base network support  
- **MiniKit SDK**: For Farcaster frame integration
- **Wagmi + Viem**: For Ethereum contract interactions
- **Next.js 15**: For the React framework with app router

### Key Features
- ✅ Wallet connection with OnchainKit
- ✅ Mobile-first responsive design
- ✅ Frame metadata for Farcaster integration
- ✅ Real ETH staking via smart contracts
- ✅ Real-time multiplayer gameplay
- ✅ Automatic pot distribution

## 🎯 How to Play

### Game Flow
1. **Create/Join Lobby**: Set stake amount and max players
2. **Wait for Players**: Share lobby ID with friends  
3. **Role Assignment**: Secretly receive Crew or Traitor role
4. **Discussion Phase**: 2-minute chat to discuss suspicions
5. **Voting Phase**: 30-second voting to eliminate suspects
6. **Repeat**: Continue until Traitor is eliminated or survives

### Victory Conditions
- **Crew Victory**: Eliminate the Traitor → Split the pot among survivors
- **Traitor Victory**: 
  - Survive all voting rounds → Take the entire pot
  - OR click "RUG POT" any time → Instantly take everything

## 🔗 Smart Contract

The game uses a custom escrow smart contract deployed on Base:
- **Secure ETH Staking**: Players stake ETH to join games
- **Automatic Payouts**: Winners automatically receive their share
- **Rug Protection**: Only verified traitors can rug the pot
- **Emergency Withdrawals**: Timeout protection for abandoned games

### Contract Features
- Multi-player game lobbies
- Stake amount validation (0.001 - 1 ETH)
- Automatic role assignment verification
- Secure pot distribution
- Emergency withdrawal mechanisms

## 🏗️ Architecture

### Frontend Stack
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **ShadCN UI**: Component library
- **Zustand**: Client-side state management
- **TanStack Query**: Server state management

### Blockchain Stack
- **Solidity**: Smart contract development
- **Hardhat**: Development environment
- **Wagmi**: React hooks for Ethereum
- **Viem**: TypeScript Ethereum client
- **Base Network**: Layer 2 blockchain

### Real-time Stack
- **Socket.io**: Real-time communication
- **Redis** (optional): Message persistence
- **WebSocket**: Low-latency updates

## 🚢 Deployment

### Smart Contract Deployment

1. **Deploy to Base Sepolia (testnet):**
   ```bash
   bun run deploy:sepolia
   ```

2. **Deploy to Base Mainnet:**
   ```bash
   bun run deploy:mainnet
   ```

3. **Verify on BaseScan:**
   ```bash
   bun run verify --network base <contract-address>
   ```

### Frontend Deployment

Deploy to Vercel (recommended):

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Farcaster Frame Setup

1. Deploy to a public URL
2. Generate Farcaster manifest using custody wallet
3. Submit to Farcaster for frame approval
4. Share frame link in casts

## 🧪 Testing

```bash
# Run smart contract tests
bun run test

# Run frontend in development
bun run dev

# Build for production
bun run build

# Type checking
bun run type-check

# Linting
bun run lint
```

## 📱 Mobile Optimization

The app is built mobile-first with:
- Touch-friendly buttons (min 44px)
- Responsive layouts for all screen sizes
- Swipe gestures for voting
- Safe area insets for notched devices
- Progressive Web App features

## 🔒 Security Considerations

- **Smart Contract Security**: Audited escrow logic with reentrancy protection
- **Private Key Safety**: Never expose private keys in frontend
- **Role Assignment**: Server-side verification prevents cheating
- **Rate Limiting**: Prevents spam in chat and voting
- **Input Validation**: All user inputs are validated

## 🎨 Game Design

### Visual Design
- Dark theme with red/black color scheme
- High contrast for accessibility
- Animated role reveals and game transitions
- Clear visual hierarchy for important actions

### User Experience  
- Intuitive lobby creation and joining
- Real-time updates without page refreshes
- Clear game state indicators
- Mobile-optimized chat interface

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This is a game involving real cryptocurrency. Only play with ETH you can afford to lose. The developers are not responsible for any financial losses. Always verify smart contract addresses before interacting.

## 🙋 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs via GitHub Issues
- **Community**: Join our Discord/Telegram for discussion
- **Updates**: Follow development progress on GitHub

---

Built with ❤️ on Base • Made for Farcaster