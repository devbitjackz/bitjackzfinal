import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RouletteResult {
  result: string;
  winningNumber: number;
  multiplier: number;
  payout: number;
  newBalance: number;
}

export default function RouletteGame() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [betAmount, setBetAmount] = useState("10.00");
  const [selectedBet, setSelectedBet] = useState<{
    type: "number" | "red" | "black" | "odd" | "even" | "high" | "low";
    value?: number;
  } | null>(null);

  const { data: balance } = useQuery<{ balance: number }>({
    queryKey: ["/api/balance"],
  });

  const playGameMutation = useMutation({
    mutationFn: async (gameData: { betAmount: number; betType: string; betValue?: number }) => {
      const response = await apiRequest("POST", "/api/games/roulette", gameData);
      return response.json() as Promise<RouletteResult>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games/recent"] });
      
      if (data.result === "win") {
        toast({
          title: "Winner!",
          description: `Number ${data.winningNumber} - You won $${data.payout.toFixed(2)} with ${data.multiplier}x!`,
        });
      } else {
        toast({
          title: "Better luck next time!",
          description: `Number ${data.winningNumber} - Your bet didn't win this time`,
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

  const handleBetSelection = (type: "number" | "red" | "black" | "odd" | "even" | "high" | "low", value?: number) => {
    setSelectedBet({ type, value });
  };

  const handlePlay = () => {
    if (!selectedBet) {
      toast({
        title: "No bet selected",
        description: "Please select a bet first",
        variant: "destructive",
      });
      return;
    }

    const bet = parseFloat(betAmount);
    
    if (bet <= 0) {
      toast({
        title: "Invalid Bet",
        description: "Please enter a valid bet amount",
        variant: "destructive",
      });
      return;
    }

    playGameMutation.mutate({ 
      betAmount: bet, 
      betType: selectedBet.type, 
      betValue: selectedBet.value 
    });
  };

  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  const blackNumbers = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

  const getMultiplier = () => {
    if (!selectedBet) return 0;
    switch (selectedBet.type) {
      case "number":
        return 36;
      case "red":
      case "black":
      case "odd":
      case "even":
      case "high":
      case "low":
        return 2;
      default:
        return 0;
    }
  };

  const potentialPayout = (parseFloat(betAmount) * getMultiplier()).toFixed(2);

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
          <h2 className="text-3xl font-bold casino-gold">ROULETTE</h2>
          <div className="text-sm text-gray-400">78 players online</div>
        </div>

        {/* Game Display */}
        <Card className="casino-bg-blue border-casino-gold/20 mb-6">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="w-32 h-32 mx-auto mb-6 bg-casino-gold/20 rounded-full flex items-center justify-center text-6xl casino-gold">
                <RotateCcw className="animate-spin" size={64} />
              </div>
              <div className="text-2xl font-bold casino-gold mb-2">European Roulette</div>
              <div className="text-gray-300">Place your bets on numbers or colors</div>
            </div>
            
            {selectedBet && (
              <div className="text-center">
                <div className="text-xl font-bold casino-gold mb-2">
                  Selected: {selectedBet.type === "number" ? `Number ${selectedBet.value}` : selectedBet.type.toUpperCase()}
                </div>
                <div className="text-lg text-gray-300">
                  Potential payout: ${potentialPayout} ({getMultiplier()}x)
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Betting Grid */}
        <Card className="casino-bg-blue/50 border-casino-gold/20 mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-13 gap-1 mb-6">
              {/* Zero */}
              <button
                onClick={() => handleBetSelection("number", 0)}
                className={`col-span-1 aspect-square bg-green-600 hover:bg-green-700 rounded flex items-center justify-center text-white font-bold ${
                  selectedBet?.type === "number" && selectedBet?.value === 0 ? "ring-2 ring-casino-gold" : ""
                }`}
              >
                0
              </button>
              
              {/* Numbers 1-36 */}
              {Array.from({ length: 36 }, (_, i) => {
                const number = i + 1;
                const isRed = redNumbers.includes(number);
                const isBlack = blackNumbers.includes(number);
                
                return (
                  <button
                    key={number}
                    onClick={() => handleBetSelection("number", number)}
                    className={`aspect-square rounded flex items-center justify-center text-white font-bold ${
                      isRed ? "bg-red-600 hover:bg-red-700" : "bg-black hover:bg-gray-900"
                    } ${
                      selectedBet?.type === "number" && selectedBet?.value === number ? "ring-2 ring-casino-gold" : ""
                    }`}
                  >
                    {number}
                  </button>
                );
              })}
            </div>
            
            {/* Outside Bets */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              <Button
                onClick={() => handleBetSelection("red")}
                className={`bg-red-600 hover:bg-red-700 text-white ${
                  selectedBet?.type === "red" ? "ring-2 ring-casino-gold" : ""
                }`}
              >
                Red
              </Button>
              <Button
                onClick={() => handleBetSelection("black")}
                className={`bg-black hover:bg-gray-900 text-white ${
                  selectedBet?.type === "black" ? "ring-2 ring-casino-gold" : ""
                }`}
              >
                Black
              </Button>
              <Button
                onClick={() => handleBetSelection("odd")}
                className={`bg-casino-purple hover:bg-casino-purple/90 text-white ${
                  selectedBet?.type === "odd" ? "ring-2 ring-casino-gold" : ""
                }`}
              >
                Odd
              </Button>
              <Button
                onClick={() => handleBetSelection("even")}
                className={`bg-casino-purple hover:bg-casino-purple/90 text-white ${
                  selectedBet?.type === "even" ? "ring-2 ring-casino-gold" : ""
                }`}
              >
                Even
              </Button>
              <Button
                onClick={() => handleBetSelection("low")}
                className={`bg-casino-cyan hover:bg-casino-cyan/90 text-white ${
                  selectedBet?.type === "low" ? "ring-2 ring-casino-gold" : ""
                }`}
              >
                1-18
              </Button>
              <Button
                onClick={() => handleBetSelection("high")}
                className={`bg-casino-cyan hover:bg-casino-cyan/90 text-white ${
                  selectedBet?.type === "high" ? "ring-2 ring-casino-gold" : ""
                }`}
              >
                19-36
              </Button>
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
          </CardContent>
        </Card>

        {/* Play Button */}
        <Button
          onClick={handlePlay}
          disabled={!selectedBet || playGameMutation.isPending}
          className="w-full bg-casino-gold hover:bg-casino-gold/90 text-casino-navy py-6 text-lg font-bold mb-8"
        >
          {playGameMutation.isPending ? "Spinning..." : "Spin Wheel"}
        </Button>
      </div>
    </div>
  );
}
