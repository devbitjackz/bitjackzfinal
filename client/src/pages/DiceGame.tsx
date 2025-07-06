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
  const [isManual, setIsManual] = useState(true);
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
    const target = rollTarget[0];
    
    if (bet <= 0 || target < 2 || target > 98) {
      toast({
        title: "Invalid Input",
        description: "Please enter valid bet amount and target (2-98)",
        variant: "destructive",
      });
      return;
    }

    // Roll over if target < 50, under if target >= 50
    const isOver = target < 50;
    playGameMutation.mutate({ betAmount: bet, target, isOver });
  };

  const target = rollTarget[0];
  const isOver = target < 50;
  const winChance = isOver ? (99 - target) : target;
  const multiplier = (99 / winChance);
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
          {/* Mode Toggle */}
          <div className="flex bg-gray-700 rounded-lg p-1 mb-6">
            <button
              onClick={() => setIsManual(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                isManual ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Manual
            </button>
            <button
              onClick={() => setIsManual(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                !isManual ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Auto
            </button>
            <button className="p-2 text-gray-400 hover:text-white">
              <RotateCcw size={16} />
            </button>
          </div>

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
              <div className="flex ml-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newAmount = (parseFloat(betAmount || "0") / 2).toFixed(8);
                    setBetAmount(newAmount);
                    updateProfit();
                  }}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black border-0 px-3 py-1 text-xs"
                >
                  ½
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newAmount = (parseFloat(betAmount || "0") * 2).toFixed(8);
                    setBetAmount(newAmount);
                    updateProfit();
                  }}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black border-0 px-3 py-1 text-xs ml-1"
                >
                  2×
                </Button>
              </div>
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
              <div className="w-6 h-6 bg-yellow-500 rounded ml-2 flex items-center justify-center">
                <span className="text-black text-xs font-bold">₿</span>
              </div>
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
              <div className="h-8 bg-gray-700 rounded-full overflow-hidden">
                {/* Red section (under) */}
                <div 
                  className="h-full bg-red-500 float-left"
                  style={{ width: `${target}%` }}
                />
                {/* Green section (over) */}
                <div 
                  className="h-full bg-green-500"
                  style={{ width: `${100 - target}%` }}
                />
              </div>
              
              {/* Slider thumb */}
              <div 
                className="absolute top-1/2 transform -translate-y-1/2 w-12 h-10 bg-blue-500 rounded cursor-pointer flex items-center justify-center text-white font-bold"
                style={{ left: `calc(${target}% - 24px)` }}
              >
                {target}
              </div>
              
              {/* Slider Input */}
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
                <div className="text-gray-400 text-sm">Multiplier</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-white text-2xl font-bold">{target}.50</div>
                <div className="text-gray-400 text-sm">Roll {isOver ? 'Over' : 'Under'}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-white text-2xl font-bold">{winChance.toFixed(4)}</div>
                <div className="text-gray-400 text-sm">Win Chance</div>
              </div>
            </div>

            {/* Last Roll Result */}
            {lastRoll !== null && (
              <div className="text-center mt-8">
                <div className="text-white text-4xl font-bold mb-2">Last Roll: {lastRoll}</div>
                <div className={`text-lg font-medium ${
                  (isOver && lastRoll > target) || (!isOver && lastRoll < target) 
                    ? 'text-green-400' : 'text-red-400'
                }`}>
                  {(isOver && lastRoll > target) || (!isOver && lastRoll < target) ? 'WIN!' : 'LOSE!'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
