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

// Simple session store for demo purposes
const userSessions = new Map<string, number>(); // sessionId -> userId

export async function registerRoutes(app: Express): Promise<Server> {
  // Get user balance
  app.get("/api/balance", async (req, res) => {
    try {
      // In production, you'd get user ID from authentication token/session
      // For now, using the last authenticated user or default demo user
      const sessionId = req.headers['x-session-id'] as string || 'demo';
      const userId = userSessions.get(sessionId) || 1;
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({ balance: user.balance });
    } catch (error) {
      res.status(500).json({ error: "Failed to get balance" });
    }
  });

  // Global crash game state management - always running
  let globalCrashGame = {
    gameId: `crash_global_1`,
    crashPoint: Math.max(1.0, Math.round((-Math.log(Math.random()) / 0.5) * 100) / 100),
    gameStartTime: Date.now() + 5000, // Start in 5 seconds
    currentMultiplier: 1.0,
    isCrashed: false,
    status: 'countdown' as 'countdown' | 'active' | 'crashed',
    playerBets: new Map<number, {betAmount: number, cashedOut: boolean, cashedOutAt: number | null}>()
  };

  // Start the first game
  setTimeout(() => {
    globalCrashGame.status = 'active';
    globalCrashGame.gameStartTime = Date.now();
  }, 5000);

  let gameCounter = 1;

  function generateCrashPoint() {
    // Generate crash points between 1.0x and 5.86x with exponential distribution
    const random = Math.random();
    const crashPoint = Math.max(1.0, Math.min(5.86, Math.round((-Math.log(random) / 0.5) * 100) / 100));
    return crashPoint;
  }

  // Restart global game when it crashes
  function restartGlobalGame() {
    setTimeout(() => {
      globalCrashGame = {
        gameId: `crash_global_${++gameCounter}`,
        crashPoint: generateCrashPoint(),
        gameStartTime: Date.now() + 5000, // 5 second countdown
        currentMultiplier: 1.0,
        isCrashed: false,
        status: 'countdown' as 'countdown' | 'active' | 'crashed',
        playerBets: new Map<number, {betAmount: number, cashedOut: boolean, cashedOutAt: number | null}>()
      };
      
      setTimeout(() => {
        if (globalCrashGame.status === 'countdown') {
          globalCrashGame.status = 'active';
          globalCrashGame.gameStartTime = Date.now();
        }
      }, 5000);
    }, 3000); // 3 second break between games
  }

  // Update global game state continuously
  setInterval(() => {
    if (globalCrashGame.status === 'active' && !globalCrashGame.isCrashed) {
      const elapsed = Date.now() - globalCrashGame.gameStartTime;
      // Limit multiplier to maximum 5.86x
      globalCrashGame.currentMultiplier = Math.min(
        Math.min(1.0 + (elapsed / 50) * 0.01, globalCrashGame.crashPoint),
        5.86
      );
      
      // Check if crashed
      if (globalCrashGame.currentMultiplier >= globalCrashGame.crashPoint) {
        globalCrashGame.isCrashed = true;
        globalCrashGame.status = 'crashed';
        
        // Handle all player bets that didn't cash out
        globalCrashGame.playerBets.forEach((playerBet, userId) => {
          if (!playerBet.cashedOut) {
            storage.createGameResult({
              userId,
              gameType: "crash",
              betAmount: playerBet.betAmount,
              multiplier: 0,
              payout: 0,
              result: "loss",
            });
          }
        });
        
        restartGlobalGame();
      }
    }
  }, 50); // Update every 50ms

  // Join the global crash game with a bet
  app.post("/api/games/crash/bet", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string || 'demo';
      const userId = userSessions.get(sessionId) || 1;
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid bet amount" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.balance < amount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      // Check if user already has a bet in current game
      if (globalCrashGame.playerBets.has(userId)) {
        return res.status(400).json({ error: "You already have a bet in this game" });
      }

      // Deduct bet amount from balance
      await storage.updateUserBalance(userId, user.balance - amount);

      // Add player bet to global game
      globalCrashGame.playerBets.set(userId, {
        betAmount: amount,
        cashedOut: false,
        cashedOutAt: null
      });

      res.json({
        gameId: globalCrashGame.gameId,
        message: "Bet placed! Watch the rocket fly!",
        currentStatus: globalCrashGame.status
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to place bet" });
    }
  });

  // Get global crash game status
  app.get("/api/games/crash/status/:gameId", async (req, res) => {
    try {
      const game = globalCrashGame;
      const now = Date.now();
      let status = game.status;
      let currentMultiplier = game.currentMultiplier;

      if (now < game.gameStartTime) {
        // Still in countdown
        status = 'countdown';
        currentMultiplier = 1.0;
      } else if (!game.isCrashed) {
        // Game is active
        status = 'active';
        const elapsed = now - game.gameStartTime;
        currentMultiplier = Math.min(1.0 + (elapsed / 50) * 0.01, game.crashPoint);
        
        // Check if we should crash
        if (currentMultiplier >= game.crashPoint) {
          game.isCrashed = true;
          game.status = 'crashed';
          status = 'crashed';
          currentMultiplier = game.crashPoint;
        }
      } else {
        // Game is finished/crashed
        currentMultiplier = game.crashPoint;
      }

      game.currentMultiplier = currentMultiplier;

      const sessionId = req.headers['x-session-id'] as string || 'demo';
      const userId = userSessions.get(sessionId) || 1;
      const playerBet = game.playerBets.get(userId);

      res.json({
        gameId: game.gameId,
        status,
        currentMultiplier: Math.round(currentMultiplier * 100) / 100,
        crashPoint: game.crashPoint,
        isCrashed: game.isCrashed,
        cashedOut: playerBet?.cashedOut || false,
        cashedOutAt: playerBet?.cashedOutAt || null,
        countdownStartTime: game.gameStartTime - 5000,
        gameStartTime: game.gameStartTime
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get game status" });
    }
  });

  // Cash out from global crash game
  app.post("/api/games/crash/cashout/:gameId", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string || 'demo';
      const userId = userSessions.get(sessionId) || 1;
      const game = globalCrashGame;

      const playerBet = game.playerBets.get(userId);
      if (!playerBet) {
        return res.status(404).json({ error: "No bet found for this game" });
      }

      if (playerBet.cashedOut || game.isCrashed) {
        return res.status(400).json({ error: "Already cashed out or game crashed" });
      }

      if (game.status !== 'active') {
        return res.status(400).json({ error: "Game not active" });
      }

      // Check if crashed before cash out
      if (game.currentMultiplier >= game.crashPoint) {
        return res.json({
          result: "lose",
          message: "Crashed before cash out!",
          crashPoint: game.crashPoint,
          payoutAmount: 0
        });
      }

      // Successfully cashed out
      playerBet.cashedOut = true;
      playerBet.cashedOutAt = game.currentMultiplier;

      const payoutAmount = playerBet.betAmount * game.currentMultiplier;
      const user = await storage.getUser(userId);
      if (user) {
        await storage.updateUserBalance(userId, user.balance + payoutAmount);
      }

      // Record win
      await storage.createGameResult({
        userId,
        gameType: "crash",
        betAmount: playerBet.betAmount,
        multiplier: game.currentMultiplier,
        payout: payoutAmount,
        result: "win",
      });

      res.json({
        result: "win",
        message: `Cashed out at ${game.currentMultiplier.toFixed(2)}x!`,
        payoutAmount: Math.round(payoutAmount * 100) / 100,
        multiplier: Math.round(game.currentMultiplier * 100) / 100
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to cash out" });
    }
  });

  // Coin flip game
  app.post("/api/games/coinflip", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string || 'demo';
      const userId = userSessions.get(sessionId) || 1;
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
      const sessionId = req.headers['x-session-id'] as string || 'demo';
      const userId = userSessions.get(sessionId) || 1;
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
      const sessionId = req.headers['x-session-id'] as string || 'demo';
      const userId = userSessions.get(sessionId) || 1;
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
      const sessionId = req.headers['x-session-id'] as string || 'demo';
      const userId = userSessions.get(sessionId) || 1;
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
      const sessionId = req.headers['x-session-id'] as string || 'demo';
      const userId = userSessions.get(sessionId) || 1;
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

  // Get casino statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const allResults = await storage.getRecentGameResults(undefined, 1000);
      
      // Calculate total won today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todaysWins = allResults.filter(result => 
        result.timestamp && new Date(result.timestamp) >= today && result.result === "win"
      );
      const totalWonToday = todaysWins.reduce((sum, result) => sum + result.payout, 0);
      
      // Count active players (simplified - count recent unique players)
      const recentResults = allResults.filter(result => 
        result.timestamp && new Date(result.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      );
      const activePlayers = new Set(recentResults.map(result => result.userId)).size;
      
      // Get game-specific stats
      const gameStats = {
        crash: {
          lastMultiplier: allResults.find(r => r.gameType === "crash")?.multiplier || 2.65,
          players: recentResults.filter(r => r.gameType === "crash").length
        },
        coinflip: {
          winRate: allResults.filter(r => r.gameType === "coinflip" && r.result === "win").length / 
                   Math.max(allResults.filter(r => r.gameType === "coinflip").length, 1) * 100,
          players: recentResults.filter(r => r.gameType === "coinflip").length
        },
        limbo: {
          avgMultiplier: allResults.filter(r => r.gameType === "limbo").reduce((sum, r) => sum + r.multiplier, 0) / 
                       Math.max(allResults.filter(r => r.gameType === "limbo").length, 1),
          players: recentResults.filter(r => r.gameType === "limbo").length
        },
        dice: {
          avgWinChance: 85.5, // This would need more complex calculation based on target values
          players: recentResults.filter(r => r.gameType === "dice").length
        },
        mines: {
          avgMultiplier: allResults.filter(r => r.gameType === "mines").reduce((sum, r) => sum + r.multiplier, 0) / 
                       Math.max(allResults.filter(r => r.gameType === "mines").length, 1),
          players: recentResults.filter(r => r.gameType === "mines").length
        },
        roulette: {
          lastNumber: 17, // Would need to store this in game results
          players: recentResults.filter(r => r.gameType === "roulette").length
        }
      };

      res.json({
        totalWonToday,
        activePlayers: Math.max(activePlayers, 1234), // Show at least some activity
        gameStats
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get statistics" });
    }
  });

  // Wallet endpoints
  app.post("/api/wallet/deposit", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string || 'demo';
      const userId = userSessions.get(sessionId) || 1;
      const { amount } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid deposit amount" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const newBalance = user.balance + amount;
      await storage.updateUserBalance(userId, newBalance);
      
      res.json({ 
        success: true, 
        newBalance,
        message: "Deposit successful" 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to process deposit" });
    }
  });

  app.post("/api/wallet/withdraw", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string || 'demo';
      const userId = userSessions.get(sessionId) || 1;
      const { amount, address } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid withdrawal amount" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (user.balance < amount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      
      const newBalance = user.balance - amount;
      await storage.updateUserBalance(userId, newBalance);
      
      res.json({ 
        success: true, 
        newBalance,
        message: "Withdrawal successful" 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to process withdrawal" });
    }
  });

  app.get("/api/transactions", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string || 'demo';
      const userId = userSessions.get(sessionId) || 1;
      // For now, return empty array - will implement with database
      res.json([]);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Telegram user authentication and session management
  app.post("/api/auth/telegram", async (req, res) => {
    try {
      const { telegramData } = req.body;
      
      const telegramUser = {
        id: String(telegramData.id || 1),
        username: telegramData.username || "demo_user",
        firstName: telegramData.first_name || "Demo",
        lastName: telegramData.last_name || "User"
      };
      
      // Check if user exists by Telegram ID
      let user = await storage.getUserByTelegramId(telegramUser.id);
      
      if (!user) {
        // Create new user with initial balance of 0
        user = await storage.createUser({
          username: telegramUser.username,
          password: "telegram_auth", // Not used for Telegram users
          telegramId: telegramUser.id,
          firstName: telegramUser.firstName,
          lastName: telegramUser.lastName,
        });
      }
      
      // Create/update session
      const sessionId = `tg_${telegramUser.id}`;
      userSessions.set(sessionId, user.id);
      
      res.json({ 
        success: true, 
        sessionId,
        user: {
          id: user.id,
          username: user.username,
          telegramId: user.telegramId,
          firstName: user.firstName,
          lastName: user.lastName,
          balance: user.balance
        }
      });
    } catch (error) {
      console.error("Telegram auth error:", error);
      res.status(500).json({ error: "Failed to authenticate user" });
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
