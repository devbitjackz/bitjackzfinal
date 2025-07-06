import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DiceResult {
  result: string;
  roll: number;
  target: number;
  isOver: boolean;
  multiplier: number;
  payout: number;
  newBalance: number;
}

export default function DiceGame() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [betAmount, setBetAmount] = useState("0.00000000");
  const [profitOnWin, setProfitOnWin] = useState("0.00000000");
  const [rollTarget, setRollTarget] = useState([50]);

  const [lastRoll, setLastRoll] = useState<number | null>(null);

  const { data: balance } = useQuery<{ balance: number }>({
    queryKey: ["/api/balance"],
  });

  const playGameMutation = useMutation({
    mutationFn: async (gameData: { betAmount: number; target: number; isOver: boolean }) => {
      const response = await apiRequest("POST", "/api/games/dice", gameData);
      return response.json() as Promise<DiceResult>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games/recent"] });
      setLastRoll(data.roll);
      
      if (data.result === "win") {
        toast({
          title: "Winner!",
          description: `Rolled ${data.roll} - You won $${data.payout.toFixed(2)} with ${data.multiplier.toFixed(2)}x!`,
        });
      } else {
        toast({
          title: "Better luck next time!",
          description: `Rolled ${data.roll} - Target was ${data.isOver ? "over" : "under"} ${data.target}`,
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

  const handlePlay = () => {
    const bet = parseFloat(betAmount);
    const targetValue = rollTarget[0];
    
    if (bet <= 0 || targetValue < 2 || targetValue > 98) {
      toast({
        title: "Invalid Input",
        description: "Please enter valid bet amount and target (2-98)",
        variant: "destructive",
      });
      return;
    }

    // Always roll over - only betting on green area (roll > target)
    const isOver = true;
    playGameMutation.mutate({ betAmount: bet, target: targetValue, isOver });
  };

  const target = rollTarget[0];
  // Only roll over - green area represents winning condition (roll > target)
  const winChance = 100 - target; // Win chance is 100 - target for roll over
  const multiplier = (100 / winChance);
  const calculatedProfit = parseFloat(betAmount) * (multiplier - 1);

  // Update profit when bet amount or target changes
  const updateProfit = () => {
    setProfitOnWin(calculatedProfit.toFixed(8));
  };

  return (
    <div className="min-h-screen casino-bg-blue">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="text-white hover:text-yellow-400"
        >
          <ArrowLeft className="mr-2" size={16} />
          Back to Games
        </Button>
        <h2 className="text-2xl font-bold text-white">DICE</h2>
        <div className="text-sm text-gray-400">Roll Over/Under</div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Panel - Controls */}
        <div className="w-80 bg-gray-800/90 p-6 border-r border-gray-700">


          {/* Bet Amount */}
          <div className="mb-6">
            <Label className="text-gray-300 text-sm mb-2 block">Bet Amount</Label>
            <div className="flex items-center">
              <Input
                value={betAmount}
                onChange={(e) => {
                  setBetAmount(e.target.value);
                  updateProfit();
                }}
                className="bg-gray-700 border-gray-600 text-white flex-1"
                placeholder="0.00000000"
              />

            </div>
            <div className="text-xs text-gray-500 mt-1">$0.00</div>
          </div>

          {/* Profit on Win */}
          <div className="mb-6">
            <Label className="text-gray-300 text-sm mb-2 block">Profit on Win</Label>
            <div className="flex items-center">
              <Input
                value={profitOnWin}
                onChange={(e) => setProfitOnWin(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white flex-1"
                placeholder="0.00000000"
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">$0.00</div>
          </div>

          {/* Bet Button */}
          <Button
            onClick={handlePlay}
            disabled={playGameMutation.isPending}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 text-lg font-bold mb-6"
          >
            {playGameMutation.isPending ? "Rolling..." : "Bet"}
          </Button>
        </div>

        {/* Right Panel - Game Area */}
        <div className="flex-1 p-6">
          {/* Roll Slider */}
          <div className="max-w-4xl mx-auto">
            {/* Numbers */}
            <div className="flex justify-between text-white mb-4 text-lg font-bold">
              <span>0</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>

            {/* Slider Container */}
            <div className="relative mb-12">
              {/* Outer container with rounded corners and border */}
              <div className="h-12 bg-gray-700 rounded-full border-2 border-gray-600 overflow-hidden relative">
                {/* Gray section (no win zone) */}
                <div 
                  className="h-full bg-gray-600 absolute left-0 top-0"
                  style={{ width: `${target}%` }}
                />
                {/* Green section (roll over - winner area only) */}
                <div 
                  className="h-full bg-green-500 absolute right-0 top-0"
                  style={{ width: `${100 - target}%` }}
                />
              </div>
              
              {/* Slider thumb - blue square with target number */}
              <div 
                className="absolute top-1/2 transform -translate-y-1/2 w-14 h-10 bg-blue-500 rounded cursor-pointer flex items-center justify-center text-white font-bold text-sm shadow-lg border-2 border-blue-400"
                style={{ left: `calc(${target}% - 28px)` }}
              >
                {target}
              </div>
              
              {/* Invisible slider input */}
              <input
                type="range"
                min="2"
                max="98"
                value={target}
                onChange={(e) => {
                  setRollTarget([parseInt(e.target.value)]);
                  updateProfit();
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            {/* Game Stats */}
            <div className="grid grid-cols-3 gap-8 text-center">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-white text-2xl font-bold">{multiplier.toFixed(4)}</div>
                <div className="text-gray-400 text-sm flex items-center justify-center">
                  <span className="mr-1">Multiplier</span>
                  <span className="text-xs">×</span>
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-white text-2xl font-bold">{target}.50</div>
                <div className="text-gray-400 text-sm">Roll Over</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-white text-2xl font-bold">{winChance.toFixed(4)}</div>
                <div className="text-gray-400 text-sm flex items-center justify-center">
                  <span className="mr-1">Win Chance</span>
                  <span className="text-xs">%</span>
                </div>
              </div>
            </div>

            {/* Last Roll Result */}
            {lastRoll !== null && (
              <div className="text-center mt-8">
                <div className="text-white text-4xl font-bold mb-2">Last Roll: {lastRoll}</div>
                <div className={`text-lg font-medium ${
                  lastRoll > target ? 'text-green-400' : 'text-red-400'
                }`}>
                  {lastRoll > target ? 'WIN!' : 'LOSE!'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
