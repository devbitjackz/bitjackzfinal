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
  const [currentGameId, setCurrentGameId] = useState<string>('crash_global_1');
  const [gameStatus, setGameStatus] = useState<GameStatus | null>(null);
  const [isWatching, setIsWatching] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { data: balance } = useQuery<{ balance: number }>({
    queryKey: ["/api/balance"],
  });

  const { data: recentGames } = useQuery<any[]>({
    queryKey: ["/api/games/recent", "crash"],
  });

  // Bet on global game mutation
  const betMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest("POST", "/api/games/crash/bet", { 
        amount: amount 
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      toast({
        title: "Bet Placed!",
        description: `$${betAmount} bet placed on global game`,
        variant: "default",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to place bet",
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
      let lastMultiplier = 0;
      let lastStatus = '';
      
      const statusInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/games/crash/status/${gameId}`, {
            headers: {
              'X-Session-Id': localStorage.getItem('sessionId') || 'demo'
            }
          });
          const status: GameStatus = await response.json();
          
          // Mark as initialized after first successful fetch
          if (!isInitialized) {
            setIsInitialized(true);
          }
          
          // Only update if something actually changed to prevent excessive re-renders
          if (status.currentMultiplier !== lastMultiplier || status.status !== lastStatus || status.gameId !== currentGameId) {
            setGameStatus(status);
            lastMultiplier = status.currentMultiplier;
            lastStatus = status.status;
            
            // Update game ID if it changed (new game started)
            if (status.gameId !== currentGameId) {
              setCurrentGameId(status.gameId);
            }
          }

          // Don't stop polling when game crashes - keep watching for next game
          // if (status.status === 'crashed' || status.status === 'finished') {
          //   clearInterval(statusInterval);
          // }
        } catch (error) {
          console.error('Failed to fetch game status:', error);
          // Continue polling even on error to maintain game state
        }
      }, 100); // Update every 100ms to reduce lag

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

  // Auto-start watching global game
  useEffect(() => {
    if (isWatching) {
      startGameTracking(currentGameId, Date.now());
    }
    return () => {
      stopGameTracking();
    };
  }, [isWatching]);

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

    if (!currentGameId) {
      toast({
        title: "Game Loading",
        description: "Please wait for the game to load",
        variant: "destructive",
      });
      return;
    }

    if (gameStatus?.status === 'active' || gameStatus?.status === 'crashed') {
      toast({
        title: "Game Running",
        description: "Cannot bet on game in progress",
        variant: "destructive",
      });
      return;
    }

    betMutation.mutate(bet);
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
    if (!isInitialized) return "Connecting...";
    if (countdown > 0) return `Starting in ${countdown}s...`;
    if (gameStatus?.status === 'countdown') return "Place Your Bet";
    if (gameStatus?.status === 'active') return "🚀 FLYING - Cash Out Now!";
    if (gameStatus?.status === 'crashed') return "💥 CRASHED!";
    if (gameStatus?.status === 'finished') return "✅ Cashed Out!";
    return "Waiting for next game...";
  };

  const canCashOut = () => {
    return currentGameId && gameStatus?.status === 'active' && !gameStatus.cashedOut && !cashOutMutation.isPending;
  };

  const canPlaceBet = () => {
    return currentGameId && gameStatus?.status === 'countdown' && !betMutation.isPending;
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
            <div className="relative h-64 mb-8 bg-gradient-to-b from-blue-900 to-blue-950 rounded-lg overflow-hidden border border-casino-gold/20">
              {/* Background Grid */}
              <div className="absolute inset-0 opacity-20">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="absolute w-full h-px bg-casino-gold/20" style={{bottom: `${i * 20}%`}}></div>
                ))}
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="absolute h-full w-px bg-casino-gold/20" style={{left: `${i * 20}%`}}></div>
                ))}
              </div>
              
              {/* Rocket Animation */}
              <div className="absolute inset-0">
                {gameStatus?.status === 'active' && (
                  <>
                    {/* Rising Graph Line */}
                    <svg 
                      className="absolute inset-0 w-full h-full" 
                      viewBox="0 0 400 200"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient id="graphGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" style={{stopColor: 'rgba(255,215,0,0.9)', stopOpacity: 0.9}} />
                          <stop offset="70%" style={{stopColor: 'rgba(255,215,0,0.6)', stopOpacity: 0.6}} />
                          <stop offset="100%" style={{stopColor: 'rgba(255,215,0,0.3)', stopOpacity: 0.3}} />
                        </linearGradient>
                        <linearGradient id="graphFill" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" style={{stopColor: 'rgba(255,215,0,0.2)', stopOpacity: 0.2}} />
                          <stop offset="100%" style={{stopColor: 'rgba(255,215,0,0.05)', stopOpacity: 0.05}} />
                        </linearGradient>
                      </defs>
                      
                      {/* Graph line */}
                      <path
                        d={`M 20 180 Q ${Math.min(360, 20 + (gameStatus.currentMultiplier - 1) * 60)} ${Math.max(10, 180 - (gameStatus.currentMultiplier - 1) * 40)} ${Math.min(380, 20 + (gameStatus.currentMultiplier - 1) * 65)} ${Math.max(5, 180 - (gameStatus.currentMultiplier - 1) * 42)}`}
                        stroke="url(#graphGradient)"
                        strokeWidth="2"
                        fill="none"
                        className="transition-all duration-100 ease-out"
                      />
                      
                      {/* Graph fill area */}
                      <path
                        d={`M 20 180 Q ${Math.min(360, 20 + (gameStatus.currentMultiplier - 1) * 60)} ${Math.max(10, 180 - (gameStatus.currentMultiplier - 1) * 40)} ${Math.min(380, 20 + (gameStatus.currentMultiplier - 1) * 65)} ${Math.max(5, 180 - (gameStatus.currentMultiplier - 1) * 42)} L ${Math.min(380, 20 + (gameStatus.currentMultiplier - 1) * 65)} 180 L 20 180 Z`}
                        fill="url(#graphFill)"
                        className="transition-all duration-100 ease-out"
                      />
                    </svg>
                    
                    {/* Rocket */}
                    <div 
                      className="absolute z-10 transition-all duration-100 ease-out"
                      style={{
                        left: `${Math.min(85, 5 + (gameStatus.currentMultiplier - 1) * 15)}%`,
                        bottom: `${Math.min(80, 10 + (gameStatus.currentMultiplier - 1) * 17)}%`,
                        transform: `rotate(${Math.min(35, (gameStatus.currentMultiplier - 1) * 4)}deg)`
                      }}
                    >
                      <div className="text-7xl filter drop-shadow-lg">🚀</div>
                    </div>
                  </>
                )}
                
                {gameStatus?.status === 'crashed' && (
                  <>
                    {/* Single Explosion Animation - 1 second */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                      <div className="text-8xl animate-ping" style={{animationDuration: '1s', animationIterationCount: '1'}}>💥</div>
                    </div>
                    
                    {/* Remove crashed rocket - no rocket after crash */}
                  </>
                )}
                
                {gameStatus?.status === 'countdown' && (
                  <div className="absolute bottom-8 left-8">
                    <div className="text-6xl animate-bounce">🚀</div>
                  </div>
                )}
                
                {(!gameStatus || gameStatus.status === 'finished') && (
                  <div className="absolute bottom-8 left-8">
                    <div className="text-6xl opacity-50">🚀</div>
                  </div>
                )}
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
                    disabled={gameStatus?.status === 'active'}
                    className="pl-8 casino-bg border-casino-gold/20 text-white"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex space-x-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={gameStatus?.status === 'active'}
                    onClick={() => setBetAmount((parseFloat(betAmount) / 2).toFixed(2))}
                    className="flex-1 bg-casino-gold/20 border-casino-gold/20 casino-gold hover:bg-casino-gold/30"
                  >
                    1/2
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={gameStatus?.status === 'active'}
                    onClick={() => setBetAmount((parseFloat(betAmount) * 2).toFixed(2))}
                    className="flex-1 bg-casino-gold/20 border-casino-gold/20 casino-gold hover:bg-casino-gold/30"
                  >
                    2x
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={gameStatus?.status === 'active'}
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
            {betMutation.isPending ? "Placing Bet..." : "Place Bet"}
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
