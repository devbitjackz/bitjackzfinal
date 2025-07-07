import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import GameTile from "@/components/GameTile";

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


        {/* Flight Banner */}
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 p-8">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <h2 className="text-3xl font-bold mb-2">✈️ Flight Mode Activated</h2>
                <p className="text-lg opacity-90">Take off with BitJackz and reach new heights!</p>
              </div>
              <div className="text-6xl opacity-20">🚀</div>
            </div>
          </div>
        </div>

        {/* All Games Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">All Games</h2>
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
