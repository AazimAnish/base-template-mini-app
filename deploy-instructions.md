# Smart Contract Deployment Instructions

## Deployment Wallet
- **Address**: 0xFD848A205075Eef89c9dF6aBE1E3585cE5B27B3d
- **Private Key**: f48e848b898696de810f616debf149eab29088f0838063e139945e7d5cb8531f
- **Network**: Base Sepolia Testnet

## Steps to Deploy using Remix IDE

1. **Open Remix IDE**
   - Go to https://remix.ethereum.org

2. **Create New File**
   - Create `SUSGame.sol` in the contracts folder
   - Copy the entire contract code from `contracts/SUSGame.sol`

3. **Compile Contract**
   - Go to "Solidity Compiler" tab
   - Select Compiler version: 0.8.19 or higher
   - Click "Compile SUSGame.sol"

4. **Deploy Contract**
   - Go to "Deploy & Run Transactions" tab
   - Environment: Select "Injected Provider - MetaMask" or "WalletConnect"
   - Or use "Remix VM" with imported account
   
   **If using imported account in Remix VM:**
   - Click on "Account" dropdown
   - Click "+" to add account
   - Paste private key: `f48e848b898696de810f616debf149eab29088f0838063e139945e7d5cb8531f`
   
   **If using MetaMask:**
   - Import the wallet using the private key
   - Connect to Base Sepolia network
   - RPC URL: https://sepolia.base.org
   - Chain ID: 84532
   - Currency Symbol: ETH

5. **Deploy**
   - Select "SUSGame" contract
   - Click "Deploy"
   - Confirm transaction

6. **Get Contract Address**
   - Copy the deployed contract address
   - Update it in `src/lib/susContract.ts`

## Base Sepolia Network Details
- **RPC URL**: https://sepolia.base.org
- **Chain ID**: 84532
- **Currency**: ETH
- **Block Explorer**: https://sepolia.basescan.org

## After Deployment
- Update `SUS_GAME_CONTRACT_ADDRESS` in `src/lib/susContract.ts`
- Test the contract functions in Remix
- Verify contract on BaseScan (optional)

## Contract Functions to Test
1. `createGame(lobbyId, stakeAmount)` - Create new game
2. `joinGame(gameId)` - Join with correct stake amount
3. `startGame(gameId)` - Start the game (host only)
4. `getGameState(gameId)` - Check game state
5. `rug(gameId)` - Imposter action
6. `startVote(gameId)` - Start voting
7. `vote(gameId, playerIndex)` - Vote for player
8. `endVote(gameId)` - End voting period