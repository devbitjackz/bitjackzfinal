import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RouletteResult {
  result: string;
  winningNumber: number;
  multiplier: number;
  payout: number;
  newBalance: number;
}

const rouletteNumbers = [
  { number: 0, color: 'green' },
  { number: 32, color: 'red' }, { number: 15, color: 'black' }, { number: 19, color: 'red' }, { number: 4, color: 'black' },
  { number: 21, color: 'red' }, { number: 2, color: 'black' }, { number: 25, color: 'red' }, { number: 17, color: 'black' },
  { number: 34, color: 'red' }, { number: 6, color: 'black' }, { number: 27, color: 'red' }, { number: 13, color: 'black' },
  { number: 36, color: 'red' }, { number: 11, color: 'black' }, { number: 30, color: 'red' }, { number: 8, color: 'black' },
  { number: 23, color: 'red' }, { number: 10, color: 'black' }, { number: 5, color: 'red' }, { number: 24, color: 'black' },
  { number: 16, color: 'red' }, { number: 33, color: 'black' }, { number: 1, color: 'red' }, { number: 20, color: 'black' },
  { number: 14, color: 'red' }, { number: 31, color: 'black' }, { number: 9, color: 'red' }, { number: 22, color: 'black' },
  { number: 18, color: 'red' }, { number: 29, color: 'black' }, { number: 7, color: 'red' }, { number: 28, color: 'black' },
  { number: 12, color: 'red' }, { number: 35, color: 'black' }, { number: 3, color: 'red' }, { number: 26, color: 'black' }
];

export default function RouletteGame() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [betAmount, setBetAmount] = useState("10.00");
  const [selectedBets, setSelectedBets] = useState<{[key: string]: number}>({});
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<number | null>(null);
  const [wheelRotation, setWheelRotation] = useState(0);

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
      
      setLastResult(data.winningNumber);
      setIsSpinning(false);
      
      if (data.result === "win") {
        toast({
          title: "Winner!",
          description: `Number ${data.winningNumber} - You won $${data.payout.toFixed(2)}!`,
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
      setIsSpinning(false);
      toast({
        title: "Error",
        description: "Failed to process game",
        variant: "destructive",
      });
    },
  });

  const addBet = (betType: string, betValue?: number) => {
    const bet = parseFloat(betAmount);
    if (bet <= 0) return;

    const key = betValue !== undefined ? `${betType}-${betValue}` : betType;
    setSelectedBets(prev => ({
      ...prev,
      [key]: (prev[key] || 0) + bet
    }));
  };

  const clearBets = () => {
    setSelectedBets({});
  };

  const handleSpin = () => {
    if (Object.keys(selectedBets).length === 0) {
      toast({
        title: "No bets placed",
        description: "Please place at least one bet before spinning",
        variant: "destructive",
      });
      return;
    }

    setIsSpinning(true);
    
    // Animate wheel spin
    const spins = 5 + Math.random() * 5; // 5-10 full rotations
    const finalRotation = wheelRotation + (spins * 360);
    setWheelRotation(finalRotation);

    // Pick the first bet for now (simplified)
    const firstBetKey = Object.keys(selectedBets)[0];
    const [betType, betValue] = firstBetKey.split('-');
    
    setTimeout(() => {
      playGameMutation.mutate({
        betAmount: selectedBets[firstBetKey],
        betType,
        betValue: betValue ? parseInt(betValue) : undefined
      });
    }, 3000);
  };

  const getTotalBets = () => {
    return Object.values(selectedBets).reduce((sum, bet) => sum + bet, 0);
  };

  const getNumberColor = (num: number) => {
    if (num === 0) return 'green';
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    return redNumbers.includes(num) ? 'red' : 'black';
  };

  return (
    <div className="pt-24 pb-8 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="text-white hover:text-casino-gold"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <div className="text-white text-lg">
            Balance: ${balance?.balance?.toFixed(2) || "0.00"}
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Roulette</h1>
          <p className="text-gray-400">Place your bets and spin the wheel!</p>
        </div>

        {/* Roulette Wheel */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div 
              className="w-64 h-64 rounded-full border-6 border-yellow-500 relative overflow-hidden transition-transform duration-3000 ease-out"
              style={{ transform: `rotate(${wheelRotation}deg)` }}
            >
              {/* Wheel segments */}
              {rouletteNumbers.map((item, index) => {
                const angle = (360 / rouletteNumbers.length) * index;
                const nextAngle = (360 / rouletteNumbers.length) * (index + 1);
                
                return (
                  <div
                    key={index}
                    className={`absolute inset-0 ${
                      item.color === 'red' ? 'bg-red-600' : 
                      item.color === 'black' ? 'bg-gray-900' : 'bg-green-600'
                    }`}
                    style={{
                      clipPath: `polygon(50% 50%, ${50 + 40 * Math.cos((angle - 90) * Math.PI / 180)}% ${50 + 40 * Math.sin((angle - 90) * Math.PI / 180)}%, ${50 + 40 * Math.cos((nextAngle - 90) * Math.PI / 180)}% ${50 + 40 * Math.sin((nextAngle - 90) * Math.PI / 180)}%)`
                    }}
                  >
                    <div 
                      className="absolute text-white font-bold text-sm"
                      style={{
                        top: `${50 + 25 * Math.sin((angle + 5) * Math.PI / 180)}%`,
                        left: `${50 + 25 * Math.cos((angle + 5) * Math.PI / 180)}%`,
                        transform: `translate(-50%, -50%) rotate(${angle + 5}deg)`
                      }}
                    >
                      {item.number}
                    </div>
                  </div>
                );
              })}
              
              {/* Center circle */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-gray-900 rounded-full"></div>
              </div>
            </div>
            
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
              <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-yellow-500"></div>
            </div>
          </div>
        </div>

        {/* Betting Layout */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          {/* Numbers Grid */}
          <div className="grid grid-cols-13 gap-1 mb-3">
            {/* Zero */}
            <button
              onClick={() => addBet("number", 0)}
              className="col-span-1 bg-green-600 hover:bg-green-700 text-white p-2 rounded text-sm font-bold"
            >
              0
            </button>
            
            {/* Numbers 1-36 */}
            {Array.from({ length: 36 }, (_, i) => i + 1).map((num) => {
              const color = getNumberColor(num);
              return (
                <button
                  key={num}
                  onClick={() => addBet("number", num)}
                  className={`${
                    color === 'red' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-900 hover:bg-gray-800'
                  } text-white p-2 rounded text-sm font-bold`}
                >
                  {num}
                </button>
              );
            })}
          </div>

          {/* Outside Bets */}
          <div className="grid grid-cols-6 gap-1">
            <button
              onClick={() => addBet("low")}
              className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded text-sm font-bold"
            >
              1-18
            </button>
            <button
              onClick={() => addBet("even")}
              className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded text-sm font-bold"
            >
              Even
            </button>
            <button
              onClick={() => addBet("red")}
              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded text-sm font-bold"
            >
              Red
            </button>
            <button
              onClick={() => addBet("black")}
              className="bg-gray-900 hover:bg-gray-800 text-white p-2 rounded text-sm font-bold"
            >
              Black
            </button>
            <button
              onClick={() => addBet("odd")}
              className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded text-sm font-bold"
            >
              Odd
            </button>
            <button
              onClick={() => addBet("high")}
              className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded text-sm font-bold"
            >
              19-36
            </button>
          </div>
        </div>

        {/* Betting Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <Label htmlFor="betAmount" className="text-white text-sm">Bet Amount</Label>
              <Input
                id="betAmount"
                type="number"
                step="0.01"
                min="0.01"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white h-10"
                placeholder="Enter bet amount"
              />
            </div>
            
            <div className="text-white text-sm">
              <p>Total Bets: ${getTotalBets().toFixed(2)}</p>
              {lastResult !== null && (
                <p className="mt-1">Last Result: <span className={`font-bold ${getNumberColor(lastResult) === 'red' ? 'text-red-500' : getNumberColor(lastResult) === 'green' ? 'text-green-500' : 'text-white'}`}>{lastResult}</span></p>
              )}
            </div>

            {Object.keys(selectedBets).length > 0 && (
              <div className="text-white text-xs">
                <h3 className="font-bold mb-1">Current Bets:</h3>
                {Object.entries(selectedBets).slice(0, 3).map(([key, amount]) => (
                  <div key={key} className="flex justify-between">
                    <span>{key.replace('-', ' ')}</span>
                    <span>${amount.toFixed(2)}</span>
                  </div>
                ))}
                {Object.keys(selectedBets).length > 3 && (
                  <p className="text-gray-400">+{Object.keys(selectedBets).length - 3} more...</p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleSpin}
              disabled={isSpinning || playGameMutation.isPending}
              className="w-full bg-casino-gold hover:bg-yellow-500 text-black font-bold h-12"
            >
              {isSpinning ? "Spinning..." : "SPIN"}
            </Button>
            
            <Button
              onClick={clearBets}
              variant="outline"
              className="w-full border-gray-600 text-white hover:bg-gray-700 h-10"
            >
              Clear Bets
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}