import { users, gameResults, type User, type InsertUser, type GameResult, type InsertGameResult } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: number, newBalance: number): Promise<void>;
  createGameResult(gameResult: InsertGameResult): Promise<GameResult>;
  getRecentGameResults(gameType?: string, limit?: number): Promise<GameResult[]>;
  getUserGameResults(userId: number, limit?: number): Promise<GameResult[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private gameResults: Map<number, GameResult>;
  private currentUserId: number;
  private currentGameResultId: number;

  constructor() {
    this.users = new Map();
    this.gameResults = new Map();
    this.currentUserId = 1;
    this.currentGameResultId = 1;
    
    // Create a default user for demo purposes
    this.users.set(1, {
      id: 1,
      username: "player1", 
      password: "password",
      balance: 1247.50,
      createdAt: new Date(),
    });

    // Add some sample game results for demonstration
    this.addSampleGameResults();
  }

  private addSampleGameResults() {
    const sampleResults = [
      { gameType: "crash", betAmount: 50, multiplier: 2.84, payout: 142, result: "win" },
      { gameType: "crash", betAmount: 25, multiplier: 1.32, payout: 0, result: "loss" },
      { gameType: "coinflip", betAmount: 100, multiplier: 2, payout: 200, result: "win" },
      { gameType: "limbo", betAmount: 75, multiplier: 3.2, payout: 240, result: "win" },
      { gameType: "dice", betAmount: 30, multiplier: 1.85, payout: 55.5, result: "win" },
      { gameType: "mines", betAmount: 40, multiplier: 4.5, payout: 180, result: "win" },
      { gameType: "roulette", betAmount: 20, multiplier: 2, payout: 40, result: "win" },
      { gameType: "crash", betAmount: 60, multiplier: 5.67, payout: 340.2, result: "win" },
      { gameType: "coinflip", betAmount: 15, multiplier: 0, payout: 0, result: "loss" },
      { gameType: "limbo", betAmount: 80, multiplier: 0, payout: 0, result: "loss" },
    ];

    sampleResults.forEach((result, index) => {
      const gameResult: GameResult = {
        id: this.currentGameResultId++,
        userId: 1,
        gameType: result.gameType,
        betAmount: result.betAmount,
        multiplier: result.multiplier,
        payout: result.payout,
        result: result.result,
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Random time in last 24h
      };
      this.gameResults.set(gameResult.id, gameResult);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      balance: 1000.00,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserBalance(userId: number, newBalance: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.balance = newBalance;
      this.users.set(userId, user);
    }
  }

  async createGameResult(insertGameResult: InsertGameResult): Promise<GameResult> {
    const id = this.currentGameResultId++;
    const gameResult: GameResult = {
      id,
      userId: insertGameResult.userId,
      gameType: insertGameResult.gameType,
      betAmount: insertGameResult.betAmount,
      multiplier: insertGameResult.multiplier,
      payout: insertGameResult.payout,
      result: insertGameResult.result,
      timestamp: new Date(),
    };
    this.gameResults.set(id, gameResult);
    return gameResult;
  }

  async getRecentGameResults(gameType?: string, limit: number = 10): Promise<GameResult[]> {
    const results = Array.from(this.gameResults.values())
      .filter(result => !gameType || result.gameType === gameType)
      .sort((a, b) => b.timestamp!.getTime() - a.timestamp!.getTime())
      .slice(0, limit);
    return results;
  }

  async getUserGameResults(userId: number, limit: number = 10): Promise<GameResult[]> {
    const results = Array.from(this.gameResults.values())
      .filter(result => result.userId === userId)
      .sort((a, b) => b.timestamp!.getTime() - a.timestamp!.getTime())
      .slice(0, limit);
    return results;
  }
}

export const storage = new MemStorage();
