import { useQuery } from "@tanstack/react-query";
import GameTile from "@/components/GameTile";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, User } from "lucide-react";

interface GameResult {
  id: number;
  gameType: string;
  betAmount: number;
  multiplier: number;
  payout: number;
  result: string;
  timestamp: string;
}

export default function Home() {
  const { data: recentGames, isLoading } = useQuery<GameResult[]>({
    queryKey: ["/api/games/recent"],
  });

  const games = [
    {
      id: "crash",
      name: "CRASH",
      description: "Multiplier Game",
      icon: "🚀",
      path: "/crash",
      color: "casino-gold",
      status: "🔥 Hot",
      players: 156,
      lastValue: "2.65x",
      valueLabel: "Last Multiplier",
    },
    {
      id: "coinflip",
      name: "COIN FLIP",
      description: "50/50 Chance",
      icon: "🪙",
      path: "/coinflip",
      color: "casino-cyan",
      status: "⚡ Fast",
      players: 89,
      lastValue: "50%",
      valueLabel: "Win Rate",
    },
    {
      id: "limbo",
      name: "LIMBO",
      description: "Under/Over",
      icon: "📈",
      path: "/limbo",
      color: "casino-purple",
      status: "💎 Premium",
      players: 67,
      lastValue: "3.45x",
      valueLabel: "Target Multiplier",
    },
    {
      id: "dice",
      name: "DICE",
      description: "Roll & Win",
      icon: "🎲",
      path: "/dice",
      color: "emerald-400",
      status: "🎯 Classic",
      players: 234,
      lastValue: "85.5",
      valueLabel: "Win Chance",
    },
    {
      id: "mines",
      name: "MINES",
      description: "Minesweeper",
      icon: "💣",
      path: "/mines",
      color: "red-400",
      status: "💥 Explosive",
      players: 123,
      lastValue: "5.2x",
      valueLabel: "Current Multiplier",
    },
    {
      id: "roulette",
      name: "ROULETTE",
      description: "European",
      icon: "🎯",
      path: "/roulette",
      color: "casino-gold",
      status: "👑 Royal",
      players: 78,
      lastValue: "17",
      valueLabel: "Last Number",
    },
  ];

  const bigWins = [
    { player: "Player***123", game: "Crash - 15.6x", amount: 1567.89 },
    { player: "Player***456", game: "Roulette - Straight", amount: 3200.00 },
    { player: "Player***789", game: "Mines - 8 tiles", amount: 987.50 },
  ];

  return (
    <div className="pt-24 pb-8 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="casino-gold neon-glow">Premium</span>
            <span className="text-white"> Gaming</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Experience the thrill of high-stakes casino gaming
          </p>
          <div className="flex justify-center space-x-4">
            <div className="bg-casino-gold/20 px-6 py-3 rounded-lg">
              <div className="casino-gold font-semibold">Total Won Today</div>
              <div className="text-2xl font-bold">$24,567.89</div>
            </div>
            <div className="bg-casino-purple/20 px-6 py-3 rounded-lg">
              <div className="casino-purple font-semibold">Active Players</div>
              <div className="text-2xl font-bold">1,234</div>
            </div>
          </div>
        </div>

        {/* Game Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {games.map((game) => (
            <GameTile key={game.id} game={game} />
          ))}
        </div>

        {/* Recent Winners */}
        <Card className="casino-bg-blue border-casino-gold/20">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center casino-gold">
              <Trophy className="mr-2" size={20} />
              Recent Big Wins
            </h3>
            <div className="space-y-3">
              {bigWins.map((win, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-casino-gold/20 rounded-full flex items-center justify-center">
                      <User className="casino-gold" size={16} />
                    </div>
                    <div>
                      <div className="font-semibold">{win.player}</div>
                      <div className="text-sm text-gray-400">{win.game}</div>
                    </div>
                  </div>
                  <div className="casino-gold font-bold">${win.amount.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
