import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Play, Hand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CrashGameResult {
  result: string;
  crashMultiplier: number;
  finalMultiplier: number;
  payout: number;
  newBalance: number;
}

export default function CrashGame() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [betAmount, setBetAmount] = useState("10.00");
  const [cashOutAt, setCashOutAt] = useState("2.00");
  const [autoMode, setAutoMode] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);

  const { data: balance } = useQuery<{ balance: number }>({
    queryKey: ["/api/balance"],
  });

  const { data: recentGames } = useQuery<any[]>({
    queryKey: ["/api/games/recent", "crash"],
  });

  const playGameMutation = useMutation({
    mutationFn: async (gameData: { betAmount: number; cashOutAt?: number }) => {
      const response = await apiRequest("POST", "/api/games/crash", gameData);
      return response.json() as Promise<CrashGameResult>;
    },
    onSuccess: (data) => {
      setGameActive(false);
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games/recent"] });
      
      if (data.result === "win") {
        toast({
          title: "Winner!",
          description: `You won $${data.payout.toFixed(2)} with ${data.finalMultiplier.toFixed(2)}x multiplier!`,
        });
      } else {
        toast({
          title: "Crashed!",
          description: `The rocket crashed at ${data.crashMultiplier.toFixed(2)}x`,
          variant: "destructive",
        });
      }
    },
    onError: () => {
      setGameActive(false);
      toast({
        title: "Error",
        description: "Failed to process game",
        variant: "destructive",
      });
    },
  });

  const handlePlay = () => {
    const bet = parseFloat(betAmount);
    const cashOut = autoMode ? parseFloat(cashOutAt) : undefined;
    
    if (bet <= 0) {
      toast({
        title: "Invalid Bet",
        description: "Please enter a valid bet amount",
        variant: "destructive",
      });
      return;
    }

    setGameActive(true);
    setCurrentMultiplier(1.0);
    
    // Simulate multiplier increase
    const interval = setInterval(() => {
      setCurrentMultiplier(prev => prev + 0.01);
    }, 100);

    // Play the game after a delay
    setTimeout(() => {
      clearInterval(interval);
      playGameMutation.mutate({ betAmount: bet, cashOutAt: cashOut });
    }, Math.random() * 5000 + 2000);
  };

  const handleCashOut = () => {
    if (gameActive) {
      setGameActive(false);
      const bet = parseFloat(betAmount);
      const payout = bet * currentMultiplier;
      
      toast({
        title: "Cashed Out!",
        description: `You cashed out at ${currentMultiplier.toFixed(2)}x for $${payout.toFixed(2)}`,
      });
    }
  };

  return (
    <div className="pt-24 pb-8 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="casino-gold hover:text-white"
          >
            <ArrowLeft className="mr-2" size={16} />
            Back to Games
          </Button>
          <h2 className="text-3xl font-bold casino-gold">CRASH</h2>
          <div className="text-sm text-gray-400">156 players online</div>
        </div>

        {/* Game Display */}
        <Card className="casino-bg-blue border-casino-gold/20 mb-6">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="text-8xl font-bold casino-gold mb-4 neon-glow">
                {gameActive ? `${currentMultiplier.toFixed(2)}x` : "2.65x"}
              </div>
              <div className="text-xl text-gray-300">Current Multiplier</div>
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
              <div className="inline-block bg-casino-gold text-casino-navy px-6 py-3 rounded-lg font-bold text-lg">
                {gameActive ? "FLYING... Cash Out Now!" : "Place Your Bet"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Betting Controls */}
        <Card className="casino-bg-blue/50 border-casino-gold/20 mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium mb-2 block">Bet Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 casino-gold">$</span>
                  <Input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    className="pl-8 casino-bg border-casino-gold/20 text-white"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex space-x-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBetAmount((parseFloat(betAmount) / 2).toFixed(2))}
                    className="flex-1 bg-casino-gold/20 border-casino-gold/20 casino-gold hover:bg-casino-gold/30"
                  >
                    1/2
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBetAmount((parseFloat(betAmount) * 2).toFixed(2))}
                    className="flex-1 bg-casino-gold/20 border-casino-gold/20 casino-gold hover:bg-casino-gold/30"
                  >
                    2x
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBetAmount((balance?.balance || 0).toFixed(2))}
                    className="flex-1 bg-casino-gold/20 border-casino-gold/20 casino-gold hover:bg-casino-gold/30"
                  >
                    Max
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Auto Cash Out</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={cashOutAt}
                    onChange={(e) => setCashOutAt(e.target.value)}
                    className="pr-8 casino-bg border-casino-gold/20 text-white"
                    placeholder="2.00"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 casino-gold">x</span>
                </div>
                <div className="mt-2 flex items-center space-x-2">
                  <Checkbox
                    id="auto-mode"
                    checked={autoMode}
                    onCheckedChange={setAutoMode}
                  />
                  <Label htmlFor="auto-mode" className="text-sm">Enable Auto Cash Out</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Button
            onClick={handlePlay}
            disabled={gameActive || playGameMutation.isPending}
            className="bg-casino-gold hover:bg-casino-gold/90 text-casino-navy py-6 text-lg font-bold"
          >
            <Play className="mr-2" size={20} />
            {playGameMutation.isPending ? "Processing..." : "Place Bet"}
          </Button>
          <Button
            onClick={handleCashOut}
            disabled={!gameActive}
            className="bg-red-500 hover:bg-red-600 text-white py-6 text-lg font-bold"
          >
            <Hand className="mr-2" size={20} />
            Cash Out
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
