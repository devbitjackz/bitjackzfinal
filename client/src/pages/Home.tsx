import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import GameTile from "@/components/GameTile";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, User } from "lucide-react";
import bitjackzBanner from "@assets/banner_1751570113317.jpg";
import crashBanner from "@assets/crash_1751570711855.png";
import cointossBanner from "@assets/cointoss_1751570242550.png";
import diceBanner from "@assets/dice_1751570260412.png";
import limboBanner from "@assets/limbo_1751570260414.png";
import minesBanner from "@assets/mines_1751570716434.png";
import rouletteBanner from "@assets/roulette_1751570260414.png";

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
  const [, setLocation] = useLocation();
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
    },
    {
      id: "coinflip",
      name: "COIN FLIP",
      description: "50/50 Chance",
      icon: "🪙",
      path: "/coinflip",
      color: "casino-cyan",
      status: "⚡ Fast",
    },
    {
      id: "limbo",
      name: "LIMBO",
      description: "Under/Over",
      icon: "📈",
      path: "/limbo",
      color: "casino-purple",
      status: "💎 Premium",
    },
    {
      id: "dice",
      name: "DICE",
      description: "Roll & Win",
      icon: "🎲",
      path: "/dice",
      color: "emerald-400",
      status: "🎯 Classic",
    },
    {
      id: "mines",
      name: "MINES",
      description: "Minesweeper",
      icon: "💣",
      path: "/mines",
      color: "red-400",
      status: "💥 Explosive",
    },
    {
      id: "roulette",
      name: "ROULETTE",
      description: "European",
      icon: "🎯",
      path: "/roulette",
      color: "casino-gold",
      status: "👑 Royal",
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
        <div className="mb-12">
          <div className="relative overflow-hidden rounded-2xl">
            <img 
              src={bitjackzBanner} 
              alt="BitJackz Casino - Win Up To 500x In Crash!" 
              className="w-full h-auto object-cover"
            />
          </div>
        </div>

        {/* Game Banners */}
        <div className="mb-12">
          {/* First Row - 4 Banners */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="relative overflow-hidden rounded-lg cursor-pointer hover:scale-105 transition-transform duration-300" onClick={() => setLocation('/crash')}>
              <img 
                src={crashBanner} 
                alt="BitJackz Crash Game" 
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="relative overflow-hidden rounded-lg cursor-pointer hover:scale-105 transition-transform duration-300" onClick={() => setLocation('/coinflip')}>
              <img 
                src={cointossBanner} 
                alt="BitJackz Coin Toss Game" 
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="relative overflow-hidden rounded-lg cursor-pointer hover:scale-105 transition-transform duration-300" onClick={() => setLocation('/dice')}>
              <img 
                src={diceBanner} 
                alt="BitJackz Dice Game" 
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="relative overflow-hidden rounded-lg cursor-pointer hover:scale-105 transition-transform duration-300" onClick={() => setLocation('/limbo')}>
              <img 
                src={limboBanner} 
                alt="BitJackz Limbo Game" 
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
          
          {/* Second Row - 2 Banners Shifted Left */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="relative overflow-hidden rounded-lg cursor-pointer hover:scale-105 transition-transform duration-300" onClick={() => setLocation('/mines')}>
              <img 
                src={minesBanner} 
                alt="BitJackz Mines Game" 
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="relative overflow-hidden rounded-lg cursor-pointer hover:scale-105 transition-transform duration-300" onClick={() => setLocation('/roulette')}>
              <img 
                src={rouletteBanner} 
                alt="BitJackz Roulette Game" 
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
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
