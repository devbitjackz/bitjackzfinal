import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Play, Hand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface GameStatus {
  gameId: string;
  status: 'countdown' | 'active' | 'crashed' | 'finished';
  currentMultiplier: number;
  crashPoint: number;
  isCrashed: boolean;
  cashedOut: boolean;
  cashedOutAt?: number;
  countdownStartTime: number;
  gameStartTime: number;
}

interface CashoutResult {
  result: 'win' | 'lose';
  message: string;
  payoutAmount: number;
  multiplier?: number;
  crashPoint?: number;
}

export default function CrashGame() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [betAmount, setBetAmount] = useState("10.00");
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { data: balance } = useQuery<{ balance: number }>({
    queryKey: ["/api/balance"],
  });

  const { data: recentGames } = useQuery<any[]>({
    queryKey: ["/api/games/recent", "crash"],
  });

  // Start game mutation
  const startGameMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest("POST", "/api/games/crash/bet", { amount });
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentGameId(data.gameId);
      startGameTracking(data.gameId, data.countdownStartTime);
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start game",
        variant: "destructive",
      });
    },
  });

  // Cash out mutation
  const cashOutMutation = useMutation({
    mutationFn: async (gameId: string) => {
      const response = await apiRequest("POST", `/api/games/crash/cashout/${gameId}`, {});
      return response.json() as Promise<CashoutResult>;
    },
    onSuccess: (data) => {
      stopGameTracking();
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games/recent"] });
      
      if (data.result === "win") {
        toast({
          title: "Cashed Out!",
          description: `${data.message} Won $${data.payoutAmount.toFixed(2)}`,
        });
      } else {
        toast({
          title: "Too Late!",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cash out",
        variant: "destructive",
      });
    },
  });

  // Game tracking functions
  const startGameTracking = (gameId: string, countdownStartTime: number) => {
    const startCountdown = () => {
      const countdownInterval = setInterval(() => {
        const now = Date.now();
        const timeLeft = Math.max(0, Math.ceil((countdownStartTime + 5000 - now) / 1000));
        setCountdown(timeLeft);
        
        if (timeLeft <= 0) {
          clearInterval(countdownInterval);
          setCountdown(0);
        }
      }, 100);
      
      intervalRef.current = countdownInterval;
    };

    const trackGameStatus = () => {
      const statusInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/games/crash/status/${gameId}`, {
            headers: {
              'X-Session-Id': localStorage.getItem('sessionId') || 'demo'
            }
          });
          const status: GameStatus = await response.json();
          setGameStatus(status);

          if (status.status === 'crashed' || status.status === 'finished') {
            clearInterval(statusInterval);
            if (status.status === 'crashed' && !status.cashedOut) {
              toast({
                title: "💥 CRASHED!",
                description: `The rocket crashed at ${status.crashPoint.toFixed(2)}x`,
                variant: "destructive",
              });
            }
            setTimeout(() => {
              setCurrentGameId(null);
              setGameStatus(null);
            }, 3000);
          }
        } catch (error) {
          console.error('Failed to fetch game status:', error);
        }
      }, 50); // Update every 50ms for smooth animation

      statusIntervalRef.current = statusInterval;
    };

    startCountdown();
    trackGameStatus();
  };

  const stopGameTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
      statusIntervalRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopGameTracking();
    };
  }, []);

  const handlePlay = () => {
    const bet = parseFloat(betAmount);
    
    if (bet <= 0) {
      toast({
        title: "Invalid Bet",
        description: "Please enter a valid bet amount",
        variant: "destructive",
      });
      return;
    }

    if (currentGameId) {
      toast({
        title: "Game in Progress",
        description: "Please wait for current game to finish",
        variant: "destructive",
      });
      return;
    }

    startGameMutation.mutate(bet);
  };

  const handleCashOut = () => {
    if (currentGameId && gameStatus?.status === 'active' && !gameStatus.cashedOut) {
      cashOutMutation.mutate(currentGameId);
    }
  };

  // Helper functions for display
  const getCurrentMultiplier = () => {
    return gameStatus?.currentMultiplier || 1.0;
  };

  const getGameStatusText = () => {
    if (!currentGameId) return "Place Your Bet";
    if (countdown > 0) return `Starting in ${countdown}s...`;
    if (gameStatus?.status === 'active') return "🚀 FLYING - Cash Out Now!";
    if (gameStatus?.status === 'crashed') return "💥 CRASHED!";
    if (gameStatus?.status === 'finished') return "✅ Cashed Out!";
    return "Loading...";
  };

  const canCashOut = () => {
    return currentGameId && gameStatus?.status === 'active' && !gameStatus.cashedOut && !cashOutMutation.isPending;
  };

  const canPlaceBet = () => {
    return !currentGameId && !startGameMutation.isPending;
  };

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-2">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="casino-gold hover:text-white self-start"
          >
            <ArrowLeft className="mr-2" size={16} />
            <span className="hidden sm:inline">Back to Games</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <h2 className="text-2xl sm:text-3xl font-bold casino-gold">CRASH</h2>
          <div className="text-sm text-gray-400 hidden sm:block">156 players online</div>
        </div>

        {/* Game Display */}
        <Card className="casino-bg-blue border-casino-gold/20 mb-6">
          <CardContent className="p-4 sm:p-6 md:p-8">
            <div className="text-center mb-8">
              <div className="text-4xl sm:text-6xl md:text-8xl font-bold casino-gold mb-4 neon-glow">
                {getCurrentMultiplier().toFixed(2)}x
              </div>
              <div className="text-sm sm:text-lg md:text-xl text-gray-300">
                {countdown > 0 ? `Starting in ${countdown}s` : "Current Multiplier"}
              </div>
            </div>
            
            {/* Crash Chart Visualization */}
            <div className="relative h-40 mb-8 bg-casino-navy/50 rounded-lg overflow-hidden">
              <div className="absolute bottom-0 left-0 w-full h-full flex items-end">
                <div className="w-full h-1 bg-casino-gold/30"></div>
                <div className="absolute bottom-0 left-0 w-3/4 h-20 bg-gradient-to-r from-casino-gold/20 to-casino-gold/40 rounded-tr-lg"></div>
                <div className="absolute bottom-20 left-3/4 w-8 h-8 bg-casino-gold rounded-full animate-pulse flex items-center justify-center">
                  <span className="text-casino-navy text-xl crash-rocket">🚀</span>
                </div>
              </div>
            </div>

            {/* Game Status */}
            <div className="text-center">
              <div className={`inline-block px-6 py-3 rounded-lg font-bold text-lg ${
                gameStatus?.status === 'active' 
                  ? 'bg-green-500 text-white animate-pulse' 
                  : gameStatus?.status === 'crashed'
                  ? 'bg-red-500 text-white'
                  : 'bg-casino-gold text-casino-navy'
              }`}>
                {getGameStatusText()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Betting Controls */}
        <Card className="casino-bg-blue/50 border-casino-gold/20 mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <Label className="text-sm font-medium mb-2 block">Bet Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 casino-gold">$</span>
                  <Input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    disabled={!!currentGameId}
                    className="pl-8 casino-bg border-casino-gold/20 text-white"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex space-x-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!!currentGameId}
                    onClick={() => setBetAmount((parseFloat(betAmount) / 2).toFixed(2))}
                    className="flex-1 bg-casino-gold/20 border-casino-gold/20 casino-gold hover:bg-casino-gold/30"
                  >
                    1/2
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!!currentGameId}
                    onClick={() => setBetAmount((parseFloat(betAmount) * 2).toFixed(2))}
                    className="flex-1 bg-casino-gold/20 border-casino-gold/20 casino-gold hover:bg-casino-gold/30"
                  >
                    2x
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!!currentGameId}
                    onClick={() => setBetAmount((balance?.balance || 0).toFixed(2))}
                    className="flex-1 bg-casino-gold/20 border-casino-gold/20 casino-gold hover:bg-casino-gold/30"
                  >
                    Max
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Button
            onClick={handlePlay}
            disabled={!canPlaceBet()}
            className="bg-casino-gold hover:bg-casino-gold/90 text-casino-navy py-6 text-lg font-bold"
          >
            <Play className="mr-2" size={20} />
            {startGameMutation.isPending ? "Placing Bet..." : "Place Bet"}
          </Button>
          <Button
            onClick={handleCashOut}
            disabled={!canCashOut()}
            className={`py-6 text-lg font-bold ${
              canCashOut() 
                ? 'bg-green-500 hover:bg-green-600 text-white animate-pulse' 
                : 'bg-gray-500 text-gray-300 cursor-not-allowed'
            }`}
          >
            <Hand className="mr-2" size={20} />
            {cashOutMutation.isPending ? "Cashing Out..." : "Cash Out"}
          </Button>
        </div>

        {/* Recent Games */}
        <Card className="casino-bg-blue/50 border-casino-gold/20">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4 casino-gold">Recent Games</h3>
            <div className="flex flex-wrap gap-2">
              {recentGames?.map((game, index) => (
                <div
                  key={index}
                  className={`px-3 py-1 rounded text-sm ${
                    game.result === "win" 
                      ? "bg-casino-gold/20 casino-gold" 
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {game.multiplier.toFixed(2)}x
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
