import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import GameTile from "@/components/GameTile";

import bitjackzBanner from "@assets/banner_1751570113317.jpg";
import crashBanner from "@assets/Default_A_2D_digital_game_icon_for_a_casino_game_called_Crash__0 (1)_1751791686963.jpg";
import cointossBanner from "@assets/cointoss_1751570242550.png";
import diceBanner from "@assets/image_1751803732366.png";
import limboBanner from "@assets/image_1751804391198.png";
import minesBanner from "@assets/image_1751790163377.png";
import rouletteBanner from "@assets/image_1751804609413.png";
import turboBonusBanner from "@assets/Screenshot 2025-07-07 234311_1751912047275.png";
import cashbackBanner from "@assets/image_1751912176504.png";

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
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const { data: recentGames, isLoading } = useQuery<GameResult[]>({
    queryKey: ["/api/games/recent"],
  });

  // Banner carousel data
  const bannerSets = [
    [
      { image: turboBonusBanner, title: "Turbo Bonus", description: "425% on deposit + 250FS", action: () => setLocation('/wallet') },
      { image: cashbackBanner, title: "Cashback Thursday", description: "Get back up to 6.5% of unsuccessful bets", action: () => setLocation('/wallet') },
      { image: bitjackzBanner, title: "BitJackz Casino", description: "Win up to 500x in Crash!", action: () => setLocation('/crash') }
    ],
    [
      { image: crashBanner, title: "Crash Game", description: "Multiplier madness", action: () => setLocation('/crash') },
      { image: rouletteBanner, title: "Roulette", description: "European style", action: () => setLocation('/roulette') },
      { image: minesBanner, title: "Mines", description: "Find the gems", action: () => setLocation('/mines') }
    ],
    [
      { image: diceBanner, title: "Dice", description: "Roll and win", action: () => setLocation('/dice') },
      { image: limboBanner, title: "Limbo", description: "Under/Over game", action: () => setLocation('/limbo') },
      { image: cointossBanner, title: "Coin Flip", description: "50/50 chance", action: () => setLocation('/coinflip') }
    ]
  ];

  // Hot games
  const hotGames = [
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
      id: "roulette",
      name: "ROULETTE",
      description: "European",
      icon: "🎯",
      path: "/roulette",
      color: "casino-gold",
      status: "👑 Royal",
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
  ];

  // Degen Zone games
  const degenGames = [
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
      id: "mines",
      name: "MINES",
      description: "Minesweeper",
      icon: "💣",
      path: "/mines",
      color: "red-400",
      status: "💥 Explosive",
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
  ];

  // BitJackz Originals
  const originalGames = [
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

  const nextBannerSet = () => {
    setCurrentBannerIndex((prev) => (prev + 1) % bannerSets.length);
  };

  const prevBannerSet = () => {
    setCurrentBannerIndex((prev) => (prev - 1 + bannerSets.length) % bannerSets.length);
  };



  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-7xl mx-auto">


        {/* Scrollable Banner Carousel */}
        <div className="mb-8">
          <div className="relative">
            {/* Banner Navigation */}
            <div className="flex justify-center mb-4">
              <div className="flex space-x-2">
                {bannerSets.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentBannerIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      currentBannerIndex === index ? 'bg-casino-gold' : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Banner Display */}
            <div className="relative overflow-hidden rounded-2xl">
              <div className="flex transition-transform duration-500 ease-in-out"
                   style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}>
                {bannerSets.map((bannerSet, setIndex) => (
                  <div key={setIndex} className="w-full flex-shrink-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {bannerSet.map((banner, index) => (
                        <div 
                          key={index}
                          className="relative overflow-hidden rounded-2xl cursor-pointer hover:scale-105 transition-transform duration-300"
                          onClick={banner.action}
                        >
                          <img 
                            src={banner.image} 
                            alt={banner.title}
                            className="w-full h-auto object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={prevBannerSet}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition-all"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={nextBannerSet}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition-all"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Hot Games Section */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <h2 className="text-2xl font-bold text-white">🔥 Hot Games</h2>
            <div className="ml-3 bg-red-600 text-white text-xs px-2 py-1 rounded-full animate-pulse">
              POPULAR
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {hotGames.map((game) => (
              <GameTile key={game.id} game={game} />
            ))}
          </div>
        </div>

        {/* Degen Zone Section */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <h2 className="text-2xl font-bold text-white">⚡ Degen Zone</h2>
            <div className="ml-3 bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
              HIGH RISK
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {degenGames.map((game) => (
              <GameTile key={game.id} game={game} />
            ))}
          </div>
        </div>

        {/* BitJackz Originals Section */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <h2 className="text-2xl font-bold text-white">🎰 BitJackz Originals</h2>
            <div className="ml-3 bg-casino-gold text-black text-xs px-2 py-1 rounded-full font-bold">
              EXCLUSIVE
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {originalGames.map((game) => (
              <GameTile key={game.id} game={game} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
