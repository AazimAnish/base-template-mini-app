// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title SUSGameEscrowV2 - Fixed version with critical security improvements
 * @dev Secure escrow contract for SUS social deduction game
 */
contract SUSGameEscrowV2 is Ownable, ReentrancyGuard, Pausable {
    using ECDSA for bytes32;

    struct Game {
        address creator;
        uint256 stakeAmount;
        uint256 totalPot;
        uint8 playerCount;
        uint8 maxPlayers;
        address[] players;
        mapping(address => bool) isPlayer;
        mapping(address => uint256) playerStakes; // Track individual stakes
        GameState state;
        uint256 createdAt;
        uint256 endedAt;
        bytes32 traitorCommit; // Commitment to traitor selection
        address traitorRevealed;
        bool traitorCanRug;
        uint256 gameStartTime;
    }

    enum GameState {
        Created,
        Active,
        Ended,
        Cancelled,
        Disputed
    }

    // Packed struct for gas optimization
    struct GameInfo {
        address creator;
        uint128 stakeAmount;
        uint128 totalPot;
        uint64 createdAt;
        uint64 endedAt;
        uint32 playerCount;
        uint32 maxPlayers;
        GameState state;
    }

    mapping(bytes32 => Game) public games;
    mapping(address => bytes32[]) public playerGames;
    mapping(bytes32 => uint256) public gameTimeouts;
    
    uint256 public constant MIN_STAKE = 0.001 ether;
    uint256 public constant MAX_STAKE = 10 ether;
    uint8 public constant MIN_PLAYERS = 3;
    uint8 public constant MAX_PLAYERS = 10;
    uint256 public constant GAME_TIMEOUT = 7200; // 2 hours
    uint256 public constant VOTING_TIMEOUT = 1800; // 30 minutes
    uint256 public protocolFeePercent = 250; // 2.5%
    uint256 public constant FEE_DENOMINATOR = 10000;

    // Emergency recovery
    mapping(bytes32 => bool) public disputedGames;
    uint256 public constant DISPUTE_PERIOD = 86400; // 24 hours

    event GameCreated(bytes32 indexed gameId, address indexed creator, uint256 stakeAmount, uint8 maxPlayers);
    event PlayerJoined(bytes32 indexed gameId, address indexed player, uint8 currentPlayers);
    event GameStarted(bytes32 indexed gameId, uint8 totalPlayers, bytes32 traitorCommit);
    event GameEnded(bytes32 indexed gameId, address[] winners, uint256 totalPot, uint256 protocolFee);
    event TraitorRugged(bytes32 indexed gameId, address indexed traitor, uint256 totalPot);
    event GameCancelled(bytes32 indexed gameId, uint256 totalRefunded);
    event EmergencyRefund(bytes32 indexed gameId, address indexed player, uint256 amount);
    event TraitorRevealed(bytes32 indexed gameId, address traitor);
    event GameDisputed(bytes32 indexed gameId, address indexed disputer);

    error GameNotFound();
    error InvalidStakeAmount();
    error InvalidMaxPlayers();
    error GameIdExists();
    error GameNotAcceptingPlayers();
    error IncorrectStake();
    error AlreadyJoined();
    error GameFull();
    error GameTimedOut();
    error OnlyCreator();
    error GameNotActive();
    error NotEnoughPlayers();
    error InvalidWinners();
    error NotPlayerInGame();
    error CannotCancelActiveGame();
    error TransferFailed();
    error InvalidTraitorProof();
    error TraitorNotRevealed();
    error NotAuthorizedToRug();
    error DuplicateWinner();
    error GameNotDisputed();
    error DisputePeriodNotEnded();

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Create a new game with proper validations
     */
    function createGame(
        bytes32 gameId,
        uint8 maxPlayers
    ) external payable whenNotPaused {
        if (msg.value < MIN_STAKE || msg.value > MAX_STAKE) revert InvalidStakeAmount();
        if (maxPlayers < MIN_PLAYERS || maxPlayers > MAX_PLAYERS) revert InvalidMaxPlayers();
        if (games[gameId].creator != address(0)) revert GameIdExists();

        Game storage game = games[gameId];
        game.creator = msg.sender;
        game.stakeAmount = msg.value;
        game.totalPot = msg.value;
        game.playerCount = 1;
        game.maxPlayers = maxPlayers;
        game.players.push(msg.sender);
        game.isPlayer[msg.sender] = true;
        game.playerStakes[msg.sender] = msg.value;
        game.state = GameState.Created;
        game.createdAt = block.timestamp;

        playerGames[msg.sender].push(gameId);
        gameTimeouts[gameId] = block.timestamp + GAME_TIMEOUT;

        emit GameCreated(gameId, msg.sender, msg.value, maxPlayers);
        emit PlayerJoined(gameId, msg.sender, 1);
    }

    /**
     * @dev Join an existing game with proper validations
     */
    function joinGame(bytes32 gameId) external payable whenNotPaused nonReentrant {
        Game storage game = games[gameId];
        
        if (game.creator == address(0)) revert GameNotFound();
        if (game.state != GameState.Created) revert GameNotAcceptingPlayers();
        if (msg.value != game.stakeAmount) revert IncorrectStake();
        if (game.isPlayer[msg.sender]) revert AlreadyJoined();
        if (game.playerCount >= game.maxPlayers) revert GameFull();
        if (block.timestamp > gameTimeouts[gameId]) revert GameTimedOut();

        game.players.push(msg.sender);
        game.isPlayer[msg.sender] = true;
        game.playerStakes[msg.sender] = msg.value;
        game.playerCount++;
        game.totalPot += msg.value;

        playerGames[msg.sender].push(gameId);

        emit PlayerJoined(gameId, msg.sender, game.playerCount);

        if (game.playerCount == game.maxPlayers) {
            game.state = GameState.Active;
            game.gameStartTime = block.timestamp;
            emit GameStarted(gameId, game.playerCount, bytes32(0));
        }
    }

    /**
     * @dev Start game with traitor commitment (cryptographic proof)
     */
    function startGame(bytes32 gameId, bytes32 traitorCommit) external {
        Game storage game = games[gameId];
        
        if (game.creator != msg.sender) revert OnlyCreator();
        if (game.state != GameState.Created) revert GameNotActive();
        if (game.playerCount < MIN_PLAYERS) revert NotEnoughPlayers();

        game.state = GameState.Active;
        game.gameStartTime = block.timestamp;
        game.traitorCommit = traitorCommit;

        emit GameStarted(gameId, game.playerCount, traitorCommit);
    }

    /**
     * @dev Reveal traitor with cryptographic proof
     */
    function revealTraitor(
        bytes32 gameId,
        address traitor,
        uint256 nonce
    ) external onlyOwner {
        Game storage game = games[gameId];
        
        if (game.state != GameState.Active) revert GameNotActive();
        if (!game.isPlayer[traitor]) revert NotPlayerInGame();
        
        // Verify traitor commitment
        bytes32 hash = keccak256(abi.encodePacked(traitor, nonce));
        if (hash != game.traitorCommit) revert InvalidTraitorProof();

        game.traitorRevealed = traitor;
        game.traitorCanRug = true;

        emit TraitorRevealed(gameId, traitor);
    }

    /**
     * @dev End game with proper winner validation and remainder handling
     */
    function endGame(
        bytes32 gameId,
        address[] calldata winners
    ) external onlyOwner nonReentrant {
        Game storage game = games[gameId];
        
        if (game.state != GameState.Active) revert GameNotActive();
        if (winners.length == 0) revert InvalidWinners();
        
        // Validate all winners are unique players
        for (uint i = 0; i < winners.length; i++) {
            if (!game.isPlayer[winners[i]]) revert InvalidWinners();
            // Check for duplicates
            for (uint j = i + 1; j < winners.length; j++) {
                if (winners[i] == winners[j]) revert DuplicateWinner();
            }
        }

        game.state = GameState.Ended;
        game.endedAt = block.timestamp;

        // Calculate protocol fee
        uint256 protocolFee = (game.totalPot * protocolFeePercent) / FEE_DENOMINATOR;
        uint256 prizePool = game.totalPot - protocolFee;
        
        // Calculate winnings with remainder handling
        uint256 winnerShare = prizePool / winners.length;
        uint256 remainder = prizePool % winners.length;

        // Distribute winnings
        for (uint i = 0; i < winners.length; i++) {
            uint256 payout = winnerShare;
            // Give remainder to first winner
            if (i == 0) payout += remainder;
            
            _safeTransfer(winners[i], payout);
        }

        // Transfer protocol fee
        if (protocolFee > 0) {
            _safeTransfer(owner(), protocolFee);
        }

        emit GameEnded(gameId, winners, game.totalPot, protocolFee);
    }

    /**
     * @dev Secure rug function only for revealed traitor
     */
    function rugGame(bytes32 gameId) external nonReentrant {
        Game storage game = games[gameId];
        
        if (game.state != GameState.Active) revert GameNotActive();
        if (!game.isPlayer[msg.sender]) revert NotPlayerInGame();
        if (game.traitorRevealed == address(0)) revert TraitorNotRevealed();
        if (msg.sender != game.traitorRevealed || !game.traitorCanRug) revert NotAuthorizedToRug();

        game.state = GameState.Ended;
        game.endedAt = block.timestamp;

        // Calculate protocol fee
        uint256 protocolFee = (game.totalPot * protocolFeePercent) / FEE_DENOMINATOR;
        uint256 traitorPayout = game.totalPot - protocolFee;

        _safeTransfer(msg.sender, traitorPayout);
        
        if (protocolFee > 0) {
            _safeTransfer(owner(), protocolFee);
        }

        emit TraitorRugged(gameId, msg.sender, game.totalPot);
    }

    /**
     * @dev Cancel game with full refunds
     */
    function cancelGame(bytes32 gameId) external nonReentrant {
        Game storage game = games[gameId];
        
        if (game.creator != msg.sender) revert OnlyCreator();
        if (game.state != GameState.Created) revert CannotCancelActiveGame();

        game.state = GameState.Cancelled;

        uint256 totalRefunded = 0;
        // Refund all players their exact stakes
        for (uint i = 0; i < game.players.length; i++) {
            address player = game.players[i];
            uint256 stake = game.playerStakes[player];
            totalRefunded += stake;
            _safeTransfer(player, stake);
        }

        emit GameCancelled(gameId, totalRefunded);
    }

    /**
     * @dev Emergency individual withdrawal for timed out games
     */
    function emergencyWithdraw(bytes32 gameId) external nonReentrant {
        Game storage game = games[gameId];
        
        if (game.state != GameState.Created) revert GameNotActive();
        if (block.timestamp <= gameTimeouts[gameId]) revert();
        if (!game.isPlayer[msg.sender]) revert NotPlayerInGame();

        uint256 stake = game.playerStakes[msg.sender];
        if (stake == 0) revert();

        game.playerStakes[msg.sender] = 0;
        game.totalPot -= stake;
        
        _safeTransfer(msg.sender, stake);

        emit EmergencyRefund(gameId, msg.sender, stake);
    }

    /**
     * @dev Dispute mechanism for stuck games
     */
    function disputeGame(bytes32 gameId) external {
        Game storage game = games[gameId];
        
        if (!game.isPlayer[msg.sender]) revert NotPlayerInGame();
        if (game.state != GameState.Active) revert GameNotActive();
        if (block.timestamp < game.gameStartTime + VOTING_TIMEOUT) revert();

        game.state = GameState.Disputed;
        disputedGames[gameId] = true;

        emit GameDisputed(gameId, msg.sender);
    }

    /**
     * @dev Resolve disputed game with refunds
     */
    function resolveDispute(bytes32 gameId) external onlyOwner nonReentrant {
        Game storage game = games[gameId];
        
        if (!disputedGames[gameId]) revert GameNotDisputed();
        if (block.timestamp < game.endedAt + DISPUTE_PERIOD) revert DisputePeriodNotEnded();

        game.state = GameState.Cancelled;

        uint256 totalRefunded = 0;
        for (uint i = 0; i < game.players.length; i++) {
            address player = game.players[i];
            uint256 stake = game.playerStakes[player];
            totalRefunded += stake;
            _safeTransfer(player, stake);
        }

        delete disputedGames[gameId];
        emit GameCancelled(gameId, totalRefunded);
    }

    /**
     * @dev Safe transfer with proper error handling
     */
    function _safeTransfer(address to, uint256 amount) internal {
        if (amount == 0) return;
        
        (bool success, ) = payable(to).call{value: amount}("");
        if (!success) revert TransferFailed();
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

    function getPlayerStake(bytes32 gameId, address player) external view returns (uint256) {
        return games[gameId].playerStakes[player];
    }

    function isPlayerInGame(bytes32 gameId, address player) external view returns (bool) {
        return games[gameId].isPlayer[player];
    }

    function getPlayerGames(address player) external view returns (bytes32[] memory) {
        return playerGames[player];
    }

    function isGameTimedOut(bytes32 gameId) external view returns (bool) {
        return block.timestamp > gameTimeouts[gameId];
    }

    // Admin functions
    function setProtocolFee(uint256 newFeePercent) external onlyOwner {
        require(newFeePercent <= 1000, "Fee too high"); // Max 10%
        protocolFeePercent = newFeePercent;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Emergency admin function for extreme cases only
    function emergencyGameRefund(bytes32 gameId) external onlyOwner nonReentrant {
        Game storage game = games[gameId];
        require(game.state == GameState.Active, "Game not active");
        require(block.timestamp > game.gameStartTime + (2 * VOTING_TIMEOUT), "Too early");

        game.state = GameState.Cancelled;

        for (uint i = 0; i < game.players.length; i++) {
            address player = game.players[i];
            uint256 stake = game.playerStakes[player];
            _safeTransfer(player, stake);
        }

        emit GameCancelled(gameId, game.totalPot);
    }
}