import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import GameTile from "@/components/GameTile";


import bitjackzBanner from "@assets/banner_1751570113317.jpg";
import crashBanner from "@assets/Default_A_2D_digital_game_icon_for_a_casino_game_called_Crash__0 (1)_1751791686963.jpg";
import cointossBanner from "@assets/cointoss_1751570242550.png";
import diceBanner from "@assets/image_1751790109419.png";
import limboBanner from "@assets/limbo_1751570260414.png";
import minesBanner from "@assets/image_1751790163377.png";
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



  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
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
          {/* First Row - 3 Banners */}
          <div className="grid grid-cols-3 gap-4 mb-4">
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
          </div>
          
          {/* Second Row - 3 Banners */}
          <div className="grid grid-cols-3 gap-4">
            <div className="relative overflow-hidden rounded-lg cursor-pointer hover:scale-105 transition-transform duration-300" onClick={() => setLocation('/limbo')}>
              <img 
                src={limboBanner} 
                alt="BitJackz Limbo Game" 
                className="w-full h-auto object-cover"
              />
            </div>
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


      </div>
    </div>
  );
}
