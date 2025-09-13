// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract SUSGameEscrow is Ownable, ReentrancyGuard, Pausable {
    struct Game {
        address creator;
        uint256 stakeAmount;
        uint256 totalPot;
        uint8 playerCount;
        uint8 maxPlayers;
        address[] players;
        mapping(address => bool) isPlayer;
        GameState state;
        uint256 createdAt;
        uint256 endedAt;
        address traitor;
        address[] winners;
    }

    enum GameState {
        Created,
        Active,
        Ended,
        Cancelled
    }

    mapping(bytes32 => Game) public games;
    mapping(address => bytes32[]) public playerGames;
    
    uint256 public constant MIN_STAKE = 0.001 ether;
    uint256 public constant MAX_STAKE = 1 ether;
    uint8 public constant MIN_PLAYERS = 3;
    uint8 public constant MAX_PLAYERS = 10;
    uint256 public constant GAME_TIMEOUT = 3600; // 1 hour

    event GameCreated(bytes32 indexed gameId, address indexed creator, uint256 stakeAmount, uint8 maxPlayers);
    event PlayerJoined(bytes32 indexed gameId, address indexed player, uint8 currentPlayers);
    event GameStarted(bytes32 indexed gameId, uint8 totalPlayers);
    event GameEnded(bytes32 indexed gameId, address[] winners, uint256 totalPot);
    event TraitorRugged(bytes32 indexed gameId, address indexed traitor, uint256 totalPot);
    event GameCancelled(bytes32 indexed gameId, uint256 totalPot);

    constructor() Ownable(msg.sender) {}

    function createGame(
        bytes32 gameId,
        uint8 maxPlayers
    ) external payable whenNotPaused {
        require(msg.value >= MIN_STAKE && msg.value <= MAX_STAKE, "Invalid stake amount");
        require(maxPlayers >= MIN_PLAYERS && maxPlayers <= MAX_PLAYERS, "Invalid max players");
        require(games[gameId].creator == address(0), "Game ID already exists");

        Game storage game = games[gameId];
        game.creator = msg.sender;
        game.stakeAmount = msg.value;
        game.totalPot = msg.value;
        game.playerCount = 1;
        game.maxPlayers = maxPlayers;
        game.players.push(msg.sender);
        game.isPlayer[msg.sender] = true;
        game.state = GameState.Created;
        game.createdAt = block.timestamp;

        playerGames[msg.sender].push(gameId);

        emit GameCreated(gameId, msg.sender, msg.value, maxPlayers);
        emit PlayerJoined(gameId, msg.sender, 1);
    }

    function joinGame(bytes32 gameId) external payable whenNotPaused nonReentrant {
        Game storage game = games[gameId];
        
        require(game.creator != address(0), "Game does not exist");
        require(game.state == GameState.Created, "Game not accepting players");
        require(msg.value == game.stakeAmount, "Incorrect stake amount");
        require(!game.isPlayer[msg.sender], "Already joined this game");
        require(game.playerCount < game.maxPlayers, "Game is full");
        require(block.timestamp <= game.createdAt + GAME_TIMEOUT, "Game creation timeout");

        game.players.push(msg.sender);
        game.isPlayer[msg.sender] = true;
        game.playerCount++;
        game.totalPot += msg.value;

        playerGames[msg.sender].push(gameId);

        emit PlayerJoined(gameId, msg.sender, game.playerCount);

        if (game.playerCount == game.maxPlayers) {
            game.state = GameState.Active;
            emit GameStarted(gameId, game.playerCount);
        }
    }

    function startGame(bytes32 gameId) external {
        Game storage game = games[gameId];
        
        require(game.creator == msg.sender, "Only creator can start game");
        require(game.state == GameState.Created, "Game already started or ended");
        require(game.playerCount >= MIN_PLAYERS, "Not enough players");

        game.state = GameState.Active;
        emit GameStarted(gameId, game.playerCount);
    }

    function endGame(
        bytes32 gameId,
        address[] calldata winners
    ) external onlyOwner nonReentrant {
        Game storage game = games[gameId];
        
        require(game.state == GameState.Active, "Game not active");
        require(winners.length > 0, "Must have winners");
        
        // Validate all winners are players
        for (uint i = 0; i < winners.length; i++) {
            require(game.isPlayer[winners[i]], "Invalid winner address");
        }

        game.state = GameState.Ended;
        game.endedAt = block.timestamp;
        game.winners = winners;

        uint256 winnerShare = game.totalPot / winners.length;
        
        for (uint i = 0; i < winners.length; i++) {
            payable(winners[i]).transfer(winnerShare);
        }

        emit GameEnded(gameId, winners, game.totalPot);
    }

    function rugGame(bytes32 gameId) external nonReentrant {
        Game storage game = games[gameId];
        
        require(game.state == GameState.Active, "Game not active");
        require(game.isPlayer[msg.sender], "Not a player in this game");

        game.state = GameState.Ended;
        game.endedAt = block.timestamp;
        game.traitor = msg.sender;

        payable(msg.sender).transfer(game.totalPot);

        emit TraitorRugged(gameId, msg.sender, game.totalPot);
    }

    function cancelGame(bytes32 gameId) external nonReentrant {
        Game storage game = games[gameId];
        
        require(game.creator == msg.sender, "Only creator can cancel");
        require(game.state == GameState.Created, "Cannot cancel active or ended game");

        game.state = GameState.Cancelled;

        // Refund all players
        for (uint i = 0; i < game.players.length; i++) {
            payable(game.players[i]).transfer(game.stakeAmount);
        }

        emit GameCancelled(gameId, game.totalPot);
    }

    function emergencyWithdraw(bytes32 gameId) external nonReentrant {
        Game storage game = games[gameId];
        
        require(game.state == GameState.Created, "Game must be in created state");
        require(block.timestamp > game.createdAt + GAME_TIMEOUT, "Game not timed out yet");
        require(game.isPlayer[msg.sender], "Not a player in this game");

        game.state = GameState.Cancelled;

        // Refund all players
        for (uint i = 0; i < game.players.length; i++) {
            payable(game.players[i]).transfer(game.stakeAmount);
        }

        emit GameCancelled(gameId, game.totalPot);
    }

    // View functions
    function getGame(bytes32 gameId) external view returns (
        address creator,
        uint256 stakeAmount,
        uint256 totalPot,
        uint8 playerCount,
        uint8 maxPlayers,
        address[] memory players,
        GameState state,
        uint256 createdAt,
        uint256 endedAt
    ) {
        Game storage game = games[gameId];
        return (
            game.creator,
            game.stakeAmount,
            game.totalPot,
            game.playerCount,
            game.maxPlayers,
            game.players,
            game.state,
            game.createdAt,
            game.endedAt
        );
    }

    function getGameWinners(bytes32 gameId) external view returns (address[] memory) {
        return games[gameId].winners;
    }

    function getPlayerGames(address player) external view returns (bytes32[] memory) {
        return playerGames[player];
    }

    function isPlayerInGame(bytes32 gameId, address player) external view returns (bool) {
        return games[gameId].isPlayer[player];
    }

    // Admin functions
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setGameOwner(address newOwner) external onlyOwner {
        _transferOwnership(newOwner);
    }

    // Emergency function to withdraw contract balance (only if no active games)
    function emergencyWithdrawAll() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}