// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SUSGame {
    uint256 public constant MAX_PLAYERS = 10;
    uint256 public constant MIN_PLAYERS = 3;
    uint256 public constant VOTE_DURATION = 30 seconds;

    enum GameState { LOBBY, PLAYING, VOTING, ENDED }
    enum Role { CREW, IMPOSTER }
    
    struct Player {
        address wallet;
        Role role;
        bool isAlive;
        bool hasVoted;
        uint256 votedFor; // index of player voted for
    }

    struct Game {
        address host;
        GameState state;
        uint256 pot;
        uint256 playerCount;
        uint256 imposterIndex;
        uint256 voteStartTime;
        uint256 stakeAmount; // Dynamic stake amount set by host
        mapping(address => uint256) playerIndex;
        mapping(uint256 => Player) players;
        mapping(uint256 => uint256) votes; // playerIndex => vote count
        bool rugExecuted;
        string lobbyId;
    }

    mapping(bytes32 => Game) public games;
    mapping(bytes32 => bool) public gameExists;

    event GameCreated(bytes32 indexed gameId, address indexed host, string lobbyId);
    event PlayerJoined(bytes32 indexed gameId, address indexed player, uint256 playerIndex);
    event GameStarted(bytes32 indexed gameId, uint256 imposterIndex);
    event VoteStarted(bytes32 indexed gameId, uint256 voteEndTime);
    event PlayerVoted(bytes32 indexed gameId, address indexed voter, uint256 votedFor);
    event PlayerEjected(bytes32 indexed gameId, uint256 ejectedPlayer, bool wasImposter);
    event GameRugged(bytes32 indexed gameId, address indexed imposter, uint256 amount);
    event GameEnded(bytes32 indexed gameId, address[] winners, uint256 winnings);

    modifier onlyHost(bytes32 gameId) {
        require(games[gameId].host == msg.sender, "Only host can perform this action");
        _;
    }

    modifier gameInState(bytes32 gameId, GameState expectedState) {
        require(games[gameId].state == expectedState, "Invalid game state");
        _;
    }

    modifier playerInGame(bytes32 gameId) {
        require(games[gameId].playerIndex[msg.sender] != 0 || 
                (games[gameId].playerCount > 0 && games[gameId].players[1].wallet == msg.sender), 
                "Player not in game");
        _;
    }

    function createGame(string memory lobbyId, uint256 stakeAmount) external returns (bytes32) {
        require(stakeAmount > 0, "Stake amount must be greater than 0");
        bytes32 gameId = keccak256(abi.encodePacked(msg.sender, block.timestamp, lobbyId));
        require(!gameExists[gameId], "Game ID collision");

        Game storage game = games[gameId];
        game.host = msg.sender;
        game.state = GameState.LOBBY;
        game.pot = 0;
        game.playerCount = 0;
        game.rugExecuted = false;
        game.lobbyId = lobbyId;
        game.stakeAmount = stakeAmount;
        
        gameExists[gameId] = true;

        emit GameCreated(gameId, msg.sender, lobbyId);
        return gameId;
    }

    function joinGame(bytes32 gameId) external payable gameInState(gameId, GameState.LOBBY) {
        Game storage game = games[gameId];
        require(msg.value == game.stakeAmount, "Incorrect stake amount");
        require(game.playerCount < MAX_PLAYERS, "Game is full");
        require(game.playerIndex[msg.sender] == 0 && 
                !(game.playerCount > 0 && game.players[1].wallet == msg.sender), 
                "Already joined");

        game.playerCount++;
        uint256 playerIdx = game.playerCount;
        
        game.players[playerIdx] = Player({
            wallet: msg.sender,
            role: Role.CREW, // Will be assigned later
            isAlive: true,
            hasVoted: false,
            votedFor: 0
        });
        
        game.playerIndex[msg.sender] = playerIdx;
        game.pot += msg.value;

        emit PlayerJoined(gameId, msg.sender, playerIdx);
    }

    function startGame(bytes32 gameId) external onlyHost(gameId) gameInState(gameId, GameState.LOBBY) {
        Game storage game = games[gameId];
        require(game.playerCount >= MIN_PLAYERS, "Not enough players");

        // Randomly assign imposter (using simple randomness for MVP)
        uint256 randomSeed = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            gameId,
            game.playerCount
        )));
        
        game.imposterIndex = (randomSeed % game.playerCount) + 1;
        game.players[game.imposterIndex].role = Role.IMPOSTER;
        
        game.state = GameState.PLAYING;

        emit GameStarted(gameId, game.imposterIndex);
    }

    function rug(bytes32 gameId) external playerInGame(gameId) gameInState(gameId, GameState.PLAYING) {
        Game storage game = games[gameId];
        uint256 playerIdx = game.playerIndex[msg.sender];
        if (playerIdx == 0 && game.players[1].wallet == msg.sender) {
            playerIdx = 1;
        }
        
        require(game.players[playerIdx].role == Role.IMPOSTER, "Only imposter can rug");
        require(!game.rugExecuted, "Already rugged");

        game.rugExecuted = true;
        game.state = GameState.ENDED;
        
        uint256 amount = game.pot;
        game.pot = 0;
        
        payable(msg.sender).transfer(amount);

        emit GameRugged(gameId, msg.sender, amount);
    }

    function startVote(bytes32 gameId) external playerInGame(gameId) gameInState(gameId, GameState.PLAYING) {
        Game storage game = games[gameId];
        game.state = GameState.VOTING;
        game.voteStartTime = block.timestamp;
        
        // Reset votes
        for (uint256 i = 1; i <= game.playerCount; i++) {
            game.players[i].hasVoted = false;
            game.players[i].votedFor = 0;
            game.votes[i] = 0;
        }

        emit VoteStarted(gameId, block.timestamp + VOTE_DURATION);
    }

    function vote(bytes32 gameId, uint256 targetPlayer) external 
        playerInGame(gameId) 
        gameInState(gameId, GameState.VOTING) 
    {
        Game storage game = games[gameId];
        require(block.timestamp < game.voteStartTime + VOTE_DURATION, "Voting period ended");
        require(targetPlayer > 0 && targetPlayer <= game.playerCount, "Invalid target");
        
        uint256 voterIdx = game.playerIndex[msg.sender];
        if (voterIdx == 0 && game.players[1].wallet == msg.sender) {
            voterIdx = 1;
        }
        
        require(game.players[voterIdx].isAlive, "Dead players cannot vote");
        require(!game.players[voterIdx].hasVoted, "Already voted");

        game.players[voterIdx].hasVoted = true;
        game.players[voterIdx].votedFor = targetPlayer;
        game.votes[targetPlayer]++;

        emit PlayerVoted(gameId, msg.sender, targetPlayer);
    }

    function endVote(bytes32 gameId) external gameInState(gameId, GameState.VOTING) {
        Game storage game = games[gameId];
        require(block.timestamp >= game.voteStartTime + VOTE_DURATION, "Voting still ongoing");

        // Find player with most votes
        uint256 maxVotes = 0;
        uint256 ejectedPlayer = 0;
        bool tie = false;

        for (uint256 i = 1; i <= game.playerCount; i++) {
            if (game.votes[i] > maxVotes) {
                maxVotes = game.votes[i];
                ejectedPlayer = i;
                tie = false;
            } else if (game.votes[i] == maxVotes && maxVotes > 0) {
                tie = true;
            }
        }

        if (!tie && ejectedPlayer != 0 && maxVotes > 0) {
            game.players[ejectedPlayer].isAlive = false;
            bool wasImposter = game.players[ejectedPlayer].role == Role.IMPOSTER;
            
            emit PlayerEjected(gameId, ejectedPlayer, wasImposter);

            if (wasImposter) {
                // Crew wins
                _endGame(gameId, false);
                return;
            }
        }

        // Continue game
        game.state = GameState.PLAYING;
    }

    function _endGame(bytes32 gameId, bool imposterWins) internal {
        Game storage game = games[gameId];
        game.state = GameState.ENDED;

        if (imposterWins) {
            // This case is handled in rug() function
            return;
        }

        // Crew wins - distribute pot among alive crew members
        uint256 aliveCrew = 0;
        for (uint256 i = 1; i <= game.playerCount; i++) {
            if (game.players[i].isAlive && game.players[i].role == Role.CREW) {
                aliveCrew++;
            }
        }

        if (aliveCrew > 0) {
            uint256 winnings = game.pot / aliveCrew;
            address[] memory winners = new address[](aliveCrew);
            uint256 winnerIndex = 0;

            for (uint256 i = 1; i <= game.playerCount; i++) {
                if (game.players[i].isAlive && game.players[i].role == Role.CREW) {
                    payable(game.players[i].wallet).transfer(winnings);
                    winners[winnerIndex] = game.players[i].wallet;
                    winnerIndex++;
                }
            }

            emit GameEnded(gameId, winners, winnings);
        }

        game.pot = 0;
    }

    // View functions
    function getGameState(bytes32 gameId) external view returns (
        address host,
        GameState state,
        uint256 pot,
        uint256 playerCount,
        string memory lobbyId,
        uint256 stakeAmount
    ) {
        Game storage game = games[gameId];
        return (game.host, game.state, game.pot, game.playerCount, game.lobbyId, game.stakeAmount);
    }

    function getPlayer(bytes32 gameId, uint256 playerIndex) external view returns (
        address wallet,
        Role role,
        bool isAlive,
        bool hasVoted
    ) {
        Player storage player = games[gameId].players[playerIndex];
        return (player.wallet, player.role, player.isAlive, player.hasVoted);
    }

    function getPlayerRole(bytes32 gameId, address playerAddr) external view returns (Role) {
        Game storage game = games[gameId];
        uint256 playerIdx = game.playerIndex[playerAddr];
        if (playerIdx == 0 && game.playerCount > 0 && game.players[1].wallet == playerAddr) {
            playerIdx = 1;
        }
        require(playerIdx != 0, "Player not in game");
        return game.players[playerIdx].role;
    }

    function getVoteResults(bytes32 gameId) external view returns (uint256[] memory) {
        Game storage game = games[gameId];
        uint256[] memory results = new uint256[](game.playerCount);
        for (uint256 i = 1; i <= game.playerCount; i++) {
            results[i-1] = game.votes[i];
        }
        return results;
    }
}