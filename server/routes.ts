import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  crashGameSchema, 
  coinFlipGameSchema, 
  limboGameSchema, 
  diceGameSchema, 
  minesGameSchema, 
  rouletteGameSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get user balance
  app.get("/api/balance", async (req, res) => {
    try {
      const userId = 1; // For demo, using fixed user ID
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({ balance: user.balance });
    } catch (error) {
      res.status(500).json({ error: "Failed to get balance" });
    }
  });

  // Crash game
  app.post("/api/games/crash", async (req, res) => {
    try {
      const userId = 1;
      const gameData = crashGameSchema.parse(req.body);
      
      const user = await storage.getUser(userId);
      if (!user || user.balance < gameData.betAmount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      
      // Generate crash multiplier (1.00 to 10.00)
      const crashMultiplier = Math.random() < 0.5 ? 
        1.00 + Math.random() * 0.5 : // 50% chance of low multiplier
        1.00 + Math.random() * 9.00; // 50% chance of higher multiplier
      
      const cashedOut = !gameData.cashOutAt || crashMultiplier >= gameData.cashOutAt;
      const finalMultiplier = cashedOut ? (gameData.cashOutAt || crashMultiplier) : 1.00;
      const payout = cashedOut ? gameData.betAmount * finalMultiplier : 0;
      
      // Update balance
      const newBalance = user.balance - gameData.betAmount + payout;
      await storage.updateUserBalance(userId, newBalance);
      
      // Record game result
      await storage.createGameResult({
        userId,
        gameType: "crash",
        betAmount: gameData.betAmount,
        multiplier: finalMultiplier,
        payout,
        result: cashedOut ? "win" : "loss",
      });
      
      res.json({
        result: cashedOut ? "win" : "loss",
        crashMultiplier,
        finalMultiplier,
        payout,
        newBalance,
      });
    } catch (error) {
      res.status(500).json({ error: "Game processing failed" });
    }
  });

  // Coin flip game
  app.post("/api/games/coinflip", async (req, res) => {
    try {
      const userId = 1;
      const gameData = coinFlipGameSchema.parse(req.body);
      
      const user = await storage.getUser(userId);
      if (!user || user.balance < gameData.betAmount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      
      const result = Math.random() < 0.5 ? "heads" : "tails";
      const won = result === gameData.choice;
      const payout = won ? gameData.betAmount * 2 : 0;
      
      const newBalance = user.balance - gameData.betAmount + payout;
      await storage.updateUserBalance(userId, newBalance);
      
      await storage.createGameResult({
        userId,
        gameType: "coinflip",
        betAmount: gameData.betAmount,
        multiplier: won ? 2 : 0,
        payout,
        result: won ? "win" : "loss",
      });
      
      res.json({
        result: won ? "win" : "loss",
        flipResult: result,
        payout,
        newBalance,
      });
    } catch (error) {
      res.status(500).json({ error: "Game processing failed" });
    }
  });

  // Limbo game
  app.post("/api/games/limbo", async (req, res) => {
    try {
      const userId = 1;
      const gameData = limboGameSchema.parse(req.body);
      
      const user = await storage.getUser(userId);
      if (!user || user.balance < gameData.betAmount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      
      const randomMultiplier = 1 + Math.random() * 99;
      const won = randomMultiplier >= gameData.target;
      const payout = won ? gameData.betAmount * gameData.target : 0;
      
      const newBalance = user.balance - gameData.betAmount + payout;
      await storage.updateUserBalance(userId, newBalance);
      
      await storage.createGameResult({
        userId,
        gameType: "limbo",
        betAmount: gameData.betAmount,
        multiplier: won ? gameData.target : 0,
        payout,
        result: won ? "win" : "loss",
      });
      
      res.json({
        result: won ? "win" : "loss",
        randomMultiplier,
        target: gameData.target,
        payout,
        newBalance,
      });
    } catch (error) {
      res.status(500).json({ error: "Game processing failed" });
    }
  });

  // Dice game
  app.post("/api/games/dice", async (req, res) => {
    try {
      const userId = 1;
      const gameData = diceGameSchema.parse(req.body);
      
      const user = await storage.getUser(userId);
      if (!user || user.balance < gameData.betAmount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      
      const roll = Math.floor(Math.random() * 100) + 1;
      const won = gameData.isOver ? roll > gameData.target : roll < gameData.target;
      const winChance = gameData.isOver ? (100 - gameData.target) : gameData.target;
      const multiplier = won ? (100 / winChance) : 0;
      const payout = won ? gameData.betAmount * multiplier : 0;
      
      const newBalance = user.balance - gameData.betAmount + payout;
      await storage.updateUserBalance(userId, newBalance);
      
      await storage.createGameResult({
        userId,
        gameType: "dice",
        betAmount: gameData.betAmount,
        multiplier,
        payout,
        result: won ? "win" : "loss",
      });
      
      res.json({
        result: won ? "win" : "loss",
        roll,
        target: gameData.target,
        isOver: gameData.isOver,
        multiplier,
        payout,
        newBalance,
      });
    } catch (error) {
      res.status(500).json({ error: "Game processing failed" });
    }
  });

  // Mines game
  app.post("/api/games/mines", async (req, res) => {
    try {
      const userId = 1;
      const gameData = minesGameSchema.parse(req.body);
      
      const user = await storage.getUser(userId);
      if (!user || user.balance < gameData.betAmount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      
      // Generate mine positions
      const minePositions = new Set<number>();
      while (minePositions.size < gameData.minesCount) {
        minePositions.add(Math.floor(Math.random() * 25));
      }
      
      let won = true;
      let multiplier = 1;
      
      if (gameData.selectedTiles) {
        // Check if any selected tile is a mine
        for (const tile of gameData.selectedTiles) {
          if (minePositions.has(tile)) {
            won = false;
            break;
          }
        }
        
        if (won) {
          // Calculate multiplier based on tiles revealed and mines
          const tilesRevealed = gameData.selectedTiles.length;
          const safeTiles = 25 - gameData.minesCount;
          multiplier = Math.pow(safeTiles / (safeTiles - tilesRevealed + 1), tilesRevealed);
        }
      }
      
      const payout = won ? gameData.betAmount * multiplier : 0;
      const newBalance = user.balance - gameData.betAmount + payout;
      await storage.updateUserBalance(userId, newBalance);
      
      await storage.createGameResult({
        userId,
        gameType: "mines",
        betAmount: gameData.betAmount,
        multiplier: won ? multiplier : 0,
        payout,
        result: won ? "win" : "loss",
      });
      
      res.json({
        result: won ? "win" : "loss",
        minePositions: Array.from(minePositions),
        multiplier,
        payout,
        newBalance,
      });
    } catch (error) {
      res.status(500).json({ error: "Game processing failed" });
    }
  });

  // Roulette game
  app.post("/api/games/roulette", async (req, res) => {
    try {
      const userId = 1;
      const gameData = rouletteGameSchema.parse(req.body);
      
      const user = await storage.getUser(userId);
      if (!user || user.balance < gameData.betAmount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      
      const winningNumber = Math.floor(Math.random() * 37); // 0-36
      let won = false;
      let multiplier = 0;
      
      if (gameData.betType === "number" && gameData.betValue === winningNumber) {
        won = true;
        multiplier = 36;
      } else if (gameData.betType === "red" && isRed(winningNumber)) {
        won = true;
        multiplier = 2;
      } else if (gameData.betType === "black" && isBlack(winningNumber)) {
        won = true;
        multiplier = 2;
      } else if (gameData.betType === "odd" && winningNumber % 2 === 1 && winningNumber !== 0) {
        won = true;
        multiplier = 2;
      } else if (gameData.betType === "even" && winningNumber % 2 === 0 && winningNumber !== 0) {
        won = true;
        multiplier = 2;
      } else if (gameData.betType === "high" && winningNumber >= 19 && winningNumber <= 36) {
        won = true;
        multiplier = 2;
      } else if (gameData.betType === "low" && winningNumber >= 1 && winningNumber <= 18) {
        won = true;
        multiplier = 2;
      }
      
      const payout = won ? gameData.betAmount * multiplier : 0;
      const newBalance = user.balance - gameData.betAmount + payout;
      await storage.updateUserBalance(userId, newBalance);
      
      await storage.createGameResult({
        userId,
        gameType: "roulette",
        betAmount: gameData.betAmount,
        multiplier: won ? multiplier : 0,
        payout,
        result: won ? "win" : "loss",
      });
      
      res.json({
        result: won ? "win" : "loss",
        winningNumber,
        multiplier,
        payout,
        newBalance,
      });
    } catch (error) {
      res.status(500).json({ error: "Game processing failed" });
    }
  });

  // Get recent game results
  app.get("/api/games/recent", async (req, res) => {
    try {
      const { gameType, limit } = req.query;
      const results = await storage.getRecentGameResults(
        gameType as string,
        limit ? parseInt(limit as string) : 10
      );
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to get recent games" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function isRed(number: number): boolean {
  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  return redNumbers.includes(number);
}

function isBlack(number: number): boolean {
  const blackNumbers = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];
  return blackNumbers.includes(number);
}
