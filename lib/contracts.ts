export const SUS_GAME_CONTRACT = {
  // Replace with actual deployed contract address
  address: '0x...' as `0x${string}`,
  abi: [
    // Core game functions
    {
      name: 'createGame',
      type: 'function',
      stateMutability: 'payable',
      inputs: [
        { name: 'gameId', type: 'bytes32' },
        { name: 'maxPlayers', type: 'uint8' }
      ],
      outputs: []
    },
    {
      name: 'joinGame',
      type: 'function',
      stateMutability: 'payable',
      inputs: [{ name: 'gameId', type: 'bytes32' }],
      outputs: []
    },
    {
      name: 'startGame',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [{ name: 'gameId', type: 'bytes32' }],
      outputs: []
    },
    {
      name: 'endGame',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'gameId', type: 'bytes32' },
        { name: 'winners', type: 'address[]' }
      ],
      outputs: []
    },
    {
      name: 'rugGame',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [{ name: 'gameId', type: 'bytes32' }],
      outputs: []
    },
    {
      name: 'cancelGame',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [{ name: 'gameId', type: 'bytes32' }],
      outputs: []
    },
    
    // View functions
    {
      name: 'getGame',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: 'gameId', type: 'bytes32' }],
      outputs: [
        { name: 'creator', type: 'address' },
        { name: 'stakeAmount', type: 'uint256' },
        { name: 'totalPot', type: 'uint256' },
        { name: 'playerCount', type: 'uint8' },
        { name: 'maxPlayers', type: 'uint8' },
        { name: 'players', type: 'address[]' },
        { name: 'state', type: 'uint8' },
        { name: 'createdAt', type: 'uint256' },
        { name: 'endedAt', type: 'uint256' }
      ]
    },
    {
      name: 'isPlayerInGame',
      type: 'function',
      stateMutability: 'view',
      inputs: [
        { name: 'gameId', type: 'bytes32' },
        { name: 'player', type: 'address' }
      ],
      outputs: [{ name: '', type: 'bool' }]
    },
    {
      name: 'getPlayerGames',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: 'player', type: 'address' }],
      outputs: [{ name: '', type: 'bytes32[]' }]
    },

    // Events
    {
      name: 'GameCreated',
      type: 'event',
      inputs: [
        { name: 'gameId', type: 'bytes32', indexed: true },
        { name: 'creator', type: 'address', indexed: true },
        { name: 'stakeAmount', type: 'uint256' },
        { name: 'maxPlayers', type: 'uint8' }
      ]
    },
    {
      name: 'PlayerJoined',
      type: 'event',
      inputs: [
        { name: 'gameId', type: 'bytes32', indexed: true },
        { name: 'player', type: 'address', indexed: true },
        { name: 'currentPlayers', type: 'uint8' }
      ]
    },
    {
      name: 'GameStarted',
      type: 'event',
      inputs: [
        { name: 'gameId', type: 'bytes32', indexed: true },
        { name: 'totalPlayers', type: 'uint8' }
      ]
    },
    {
      name: 'GameEnded',
      type: 'event',
      inputs: [
        { name: 'gameId', type: 'bytes32', indexed: true },
        { name: 'winners', type: 'address[]' },
        { name: 'totalPot', type: 'uint256' }
      ]
    },
    {
      name: 'TraitorRugged',
      type: 'event',
      inputs: [
        { name: 'gameId', type: 'bytes32', indexed: true },
        { name: 'traitor', type: 'address', indexed: true },
        { name: 'totalPot', type: 'uint256' }
      ]
    }
  ] as const
};

// Utility functions for contract interaction
export function generateGameId(lobbyId: string): `0x${string}` {
  return `0x${Buffer.from(lobbyId).toString('hex').padEnd(64, '0')}` as `0x${string}`;
}

export function parseLobbyId(gameId: `0x${string}`): string {
  return Buffer.from(gameId.slice(2), 'hex').toString('utf8').replace(/\0/g, '');
}