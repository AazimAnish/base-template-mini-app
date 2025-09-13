import { expect } from "chai";
import { ethers } from "hardhat";
import { SUSGameEscrow } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("SUSGameEscrow", function () {
  let susGame: SUSGameEscrow;
  let owner: SignerWithAddress;
  let player1: SignerWithAddress;
  let player2: SignerWithAddress;
  let player3: SignerWithAddress;
  let player4: SignerWithAddress;

  const STAKE_AMOUNT = ethers.parseEther("0.1");
  const gameId = ethers.keccak256(ethers.toUtf8Bytes("test-game-1"));

  beforeEach(async function () {
    [owner, player1, player2, player3, player4] = await ethers.getSigners();

    const SUSGameEscrow = await ethers.getContractFactory("SUSGameEscrow");
    susGame = await SUSGameEscrow.deploy();
    await susGame.waitForDeployment();
  });

  describe("Game Creation", function () {
    it("Should create a new game successfully", async function () {
      await expect(
        susGame.connect(player1).createGame(gameId, 4, { value: STAKE_AMOUNT })
      )
        .to.emit(susGame, "GameCreated")
        .withArgs(gameId, player1.address, STAKE_AMOUNT, 4);

      const game = await susGame.getGame(gameId);
      expect(game.creator).to.equal(player1.address);
      expect(game.stakeAmount).to.equal(STAKE_AMOUNT);
      expect(game.totalPot).to.equal(STAKE_AMOUNT);
      expect(game.playerCount).to.equal(1);
      expect(game.maxPlayers).to.equal(4);
    });

    it("Should fail with invalid stake amount", async function () {
      const lowStake = ethers.parseEther("0.0001");
      await expect(
        susGame.connect(player1).createGame(gameId, 4, { value: lowStake })
      ).to.be.revertedWith("Invalid stake amount");

      const highStake = ethers.parseEther("2");
      await expect(
        susGame.connect(player1).createGame(gameId, 4, { value: highStake })
      ).to.be.revertedWith("Invalid stake amount");
    });

    it("Should fail with invalid max players", async function () {
      await expect(
        susGame.connect(player1).createGame(gameId, 2, { value: STAKE_AMOUNT })
      ).to.be.revertedWith("Invalid max players");

      await expect(
        susGame.connect(player1).createGame(gameId, 15, { value: STAKE_AMOUNT })
      ).to.be.revertedWith("Invalid max players");
    });

    it("Should fail with duplicate game ID", async function () {
      await susGame.connect(player1).createGame(gameId, 4, { value: STAKE_AMOUNT });
      
      await expect(
        susGame.connect(player2).createGame(gameId, 4, { value: STAKE_AMOUNT })
      ).to.be.revertedWith("Game ID already exists");
    });
  });

  describe("Joining Games", function () {
    beforeEach(async function () {
      await susGame.connect(player1).createGame(gameId, 4, { value: STAKE_AMOUNT });
    });

    it("Should allow players to join with correct stake", async function () {
      await expect(
        susGame.connect(player2).joinGame(gameId, { value: STAKE_AMOUNT })
      )
        .to.emit(susGame, "PlayerJoined")
        .withArgs(gameId, player2.address, 2);

      const game = await susGame.getGame(gameId);
      expect(game.playerCount).to.equal(2);
      expect(game.totalPot).to.equal(STAKE_AMOUNT * 2n);
    });

    it("Should fail with incorrect stake amount", async function () {
      const wrongStake = ethers.parseEther("0.05");
      await expect(
        susGame.connect(player2).joinGame(gameId, { value: wrongStake })
      ).to.be.revertedWith("Incorrect stake amount");
    });

    it("Should fail if player already joined", async function () {
      await expect(
        susGame.connect(player1).joinGame(gameId, { value: STAKE_AMOUNT })
      ).to.be.revertedWith("Already joined this game");
    });

    it("Should start game automatically when full", async function () {
      await susGame.connect(player2).joinGame(gameId, { value: STAKE_AMOUNT });
      await susGame.connect(player3).joinGame(gameId, { value: STAKE_AMOUNT });
      
      await expect(
        susGame.connect(player4).joinGame(gameId, { value: STAKE_AMOUNT })
      )
        .to.emit(susGame, "GameStarted")
        .withArgs(gameId, 4);

      const game = await susGame.getGame(gameId);
      expect(game.state).to.equal(1); // GameState.Active
    });
  });

  describe("Game Management", function () {
    beforeEach(async function () {
      await susGame.connect(player1).createGame(gameId, 4, { value: STAKE_AMOUNT });
      await susGame.connect(player2).joinGame(gameId, { value: STAKE_AMOUNT });
      await susGame.connect(player3).joinGame(gameId, { value: STAKE_AMOUNT });
    });

    it("Should allow creator to start game manually", async function () {
      await expect(susGame.connect(player1).startGame(gameId))
        .to.emit(susGame, "GameStarted")
        .withArgs(gameId, 3);

      const game = await susGame.getGame(gameId);
      expect(game.state).to.equal(1); // GameState.Active
    });

    it("Should fail if non-creator tries to start", async function () {
      await expect(
        susGame.connect(player2).startGame(gameId)
      ).to.be.revertedWith("Only creator can start game");
    });

    it("Should allow owner to end game with winners", async function () {
      await susGame.connect(player1).startGame(gameId);
      
      const winners = [player1.address, player2.address];
      await expect(susGame.endGame(gameId, winners))
        .to.emit(susGame, "GameEnded")
        .withArgs(gameId, winners, STAKE_AMOUNT * 3n);
    });
  });

  describe("Rug Functionality", function () {
    beforeEach(async function () {
      await susGame.connect(player1).createGame(gameId, 4, { value: STAKE_AMOUNT });
      await susGame.connect(player2).joinGame(gameId, { value: STAKE_AMOUNT });
      await susGame.connect(player3).joinGame(gameId, { value: STAKE_AMOUNT });
      await susGame.connect(player1).startGame(gameId);
    });

    it("Should allow traitor to rug the pot", async function () {
      const initialBalance = await ethers.provider.getBalance(player2.address);
      
      await expect(susGame.connect(player2).rugGame(gameId))
        .to.emit(susGame, "TraitorRugged")
        .withArgs(gameId, player2.address, STAKE_AMOUNT * 3n);

      const finalBalance = await ethers.provider.getBalance(player2.address);
      // Should have received the full pot minus gas costs
      expect(finalBalance - initialBalance).to.be.closeTo(STAKE_AMOUNT * 3n, ethers.parseEther("0.01"));

      const game = await susGame.getGame(gameId);
      expect(game.state).to.equal(2); // GameState.Ended
    });

    it("Should fail if non-player tries to rug", async function () {
      await expect(
        susGame.connect(player4).rugGame(gameId)
      ).to.be.revertedWith("Not a player in this game");
    });
  });

  describe("Game Cancellation", function () {
    beforeEach(async function () {
      await susGame.connect(player1).createGame(gameId, 4, { value: STAKE_AMOUNT });
      await susGame.connect(player2).joinGame(gameId, { value: STAKE_AMOUNT });
    });

    it("Should allow creator to cancel game and refund players", async function () {
      const player1InitialBalance = await ethers.provider.getBalance(player1.address);
      const player2InitialBalance = await ethers.provider.getBalance(player2.address);

      await expect(susGame.connect(player1).cancelGame(gameId))
        .to.emit(susGame, "GameCancelled")
        .withArgs(gameId, STAKE_AMOUNT * 2n);

      // Check balances (accounting for gas costs)
      const player1FinalBalance = await ethers.provider.getBalance(player1.address);
      const player2FinalBalance = await ethers.provider.getBalance(player2.address);
      
      expect(player2FinalBalance - player2InitialBalance).to.equal(STAKE_AMOUNT);
      // Player1 gets refund but pays gas, so check they got close to their stake back
      expect(player1FinalBalance - player1InitialBalance).to.be.closeTo(STAKE_AMOUNT, ethers.parseEther("0.01"));
    });

    it("Should fail if non-creator tries to cancel", async function () {
      await expect(
        susGame.connect(player2).cancelGame(gameId)
      ).to.be.revertedWith("Only creator can cancel");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await susGame.connect(player1).createGame(gameId, 4, { value: STAKE_AMOUNT });
      await susGame.connect(player2).joinGame(gameId, { value: STAKE_AMOUNT });
    });

    it("Should return correct game information", async function () {
      const game = await susGame.getGame(gameId);
      expect(game.creator).to.equal(player1.address);
      expect(game.playerCount).to.equal(2);
      expect(game.players.length).to.equal(2);
      expect(game.players[0]).to.equal(player1.address);
      expect(game.players[1]).to.equal(player2.address);
    });

    it("Should check if player is in game", async function () {
      expect(await susGame.isPlayerInGame(gameId, player1.address)).to.be.true;
      expect(await susGame.isPlayerInGame(gameId, player2.address)).to.be.true;
      expect(await susGame.isPlayerInGame(gameId, player3.address)).to.be.false;
    });

    it("Should return player's games", async function () {
      const player1Games = await susGame.getPlayerGames(player1.address);
      const player2Games = await susGame.getPlayerGames(player2.address);
      
      expect(player1Games.length).to.equal(1);
      expect(player2Games.length).to.equal(1);
      expect(player1Games[0]).to.equal(gameId);
      expect(player2Games[0]).to.equal(gameId);
    });
  });
});