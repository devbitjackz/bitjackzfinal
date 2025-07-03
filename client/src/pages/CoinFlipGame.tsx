import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Circle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CoinFlipResult {
  result: string;
  flipResult: string;
  payout: number;
  newBalance: number;
}

export default function CoinFlipGame() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [betAmount, setBetAmount] = useState("10.00");
  const [selectedSide, setSelectedSide] = useState<"heads" | "tails" | null>(null);

  const { data: balance } = useQuery<{ balance: number }>({
    queryKey: ["/api/balance"],
  });

  const { data: recentFlips } = useQuery<any[]>({
    queryKey: ["/api/games/recent", "coinflip"],
  });

  const playGameMutation = useMutation({
    mutationFn: async (gameData: { betAmount: number; choice: "heads" | "tails" }) => {
      const response = await apiRequest("POST", "/api/games/coinflip", gameData);
      return response.json() as Promise<CoinFlipResult>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games/recent"] });
      
      if (data.result === "win") {
        toast({
          title: "Winner!",
          description: `The coin landed on ${data.flipResult}! You won $${data.payout.toFixed(2)}`,
        });
      } else {
        toast({
          title: "Better luck next time!",
          description: `The coin landed on ${data.flipResult}`,
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process game",
        variant: "destructive",
      });
    },
  });

  const handlePlay = (choice: "heads" | "tails") => {
    const bet = parseFloat(betAmount);
    
    if (bet <= 0) {
      toast({
        title: "Invalid Bet",
        description: "Please enter a valid bet amount",
        variant: "destructive",
      });
      return;
    }

    setSelectedSide(choice);
    playGameMutation.mutate({ betAmount: bet, choice });
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
          <h2 className="text-3xl font-bold casino-gold">COIN FLIP</h2>
          <div className="text-sm text-gray-400">89 players online</div>
        </div>

        {/* Game Display */}
        <Card className="casino-bg-blue border-casino-gold/20 mb-6">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="w-32 h-32 mx-auto mb-6 bg-casino-gold rounded-full flex items-center justify-center text-6xl text-casino-navy animate-pulse">
                🪙
              </div>
              <div className="text-2xl font-bold casino-gold mb-2">Choose Your Side</div>
              <div className="text-gray-300">50% chance to double your bet</div>
            </div>
          </CardContent>
        </Card>

        {/* Betting Controls */}
        <Card className="casino-bg-blue/50 border-casino-gold/20 mb-6">
          <CardContent className="p-6">
            <div className="mb-6">
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

            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => handlePlay("heads")}
                disabled={playGameMutation.isPending}
                className="bg-casino-gold hover:bg-casino-gold/90 text-casino-navy py-8 text-xl font-bold"
              >
                <Circle className="block text-3xl mb-2" size={48} />
                HEADS
              </Button>
              <Button
                onClick={() => handlePlay("tails")}
                disabled={playGameMutation.isPending}
                className="bg-casino-purple hover:bg-casino-purple/90 text-white py-8 text-xl font-bold"
              >
                <Star className="block text-3xl mb-2" size={48} />
                TAILS
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Game History */}
        <Card className="casino-bg-blue/50 border-casino-gold/20">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4 casino-gold">Recent Flips</h3>
            <div className="flex flex-wrap gap-2">
              {recentFlips?.map((flip, index) => (
                <div
                  key={index}
                  className={`px-3 py-1 rounded text-sm ${
                    flip.result === "win" 
                      ? "bg-casino-gold/20 casino-gold" 
                      : "bg-casino-purple/20 casino-purple"
                  }`}
                >
                  {flip.result === "win" ? "H" : "T"}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
