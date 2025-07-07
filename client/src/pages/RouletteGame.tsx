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
  const [selectedChip, setSelectedChip] = useState(10);
  const [selectedBets, setSelectedBets] = useState<{[key: string]: number}>({});
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<number | null>(null);
  const [wheelRotation, setWheelRotation] = useState(0);

  const chipValues = [1, 2, 5, 10, 20, 50, 100];

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
    const key = betValue !== undefined ? `${betType}-${betValue}` : betType;
    setSelectedBets(prev => ({
      ...prev,
      [key]: (prev[key] || 0) + selectedChip
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
      // Clear all bets after spin
      setSelectedBets({});
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

  const getChipColor = (value: number) => {
    switch(value) {
      case 1: return 'bg-white text-black border-gray-400';
      case 2: return 'bg-pink-500 text-white border-pink-600';
      case 5: return 'bg-red-600 text-white border-red-700';
      case 10: return 'bg-blue-600 text-white border-blue-700';
      case 20: return 'bg-yellow-500 text-black border-yellow-600';
      case 50: return 'bg-green-600 text-white border-green-700';
      case 100: return 'bg-purple-600 text-white border-purple-700';
      default: return 'bg-gray-600 text-white border-gray-700';
    }
  };

  const renderChipOnBet = (betKey: string, amount: number) => {
    const chipValue = amount >= 100 ? 100 : amount >= 50 ? 50 : amount >= 20 ? 20 : amount >= 10 ? 10 : amount >= 5 ? 5 : amount >= 2 ? 2 : 1;
    const chipColor = getChipColor(chipValue);
    
    return (
      <div className={`absolute top-1 right-1 w-6 h-6 rounded-full border-2 ${chipColor} flex items-center justify-center text-xs font-bold z-10`}>
        ${chipValue}
      </div>
    );
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
          <div className="flex gap-2">
            {/* Zero Column */}
            <div className="flex flex-col">
              <button
                onClick={() => addBet("number", 0)}
                className="bg-green-600 hover:bg-green-700 text-white p-3 rounded text-sm font-bold h-16 w-12 mb-2 relative"
              >
                0
                {selectedBets["number-0"] && renderChipOnBet("number-0", selectedBets["number-0"])}
              </button>
            </div>

            {/* Main Numbers Grid (3 rows x 12 columns) */}
            <div className="flex-1">
              {/* Numbers 1-36 in proper roulette layout */}
              <div className="grid grid-cols-12 gap-1 mb-2">
                {/* Row 1: 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36 */}
                {[3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36].map((num) => {
                  const color = getNumberColor(num);
                  return (
                    <button
                      key={num}
                      onClick={() => addBet("number", num)}
                      className={`${
                        color === 'red' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-900 hover:bg-gray-800'
                      } text-white p-2 rounded text-sm font-bold h-12 relative`}
                    >
                      {num}
                      {selectedBets[`number-${num}`] && renderChipOnBet(`number-${num}`, selectedBets[`number-${num}`])}
                    </button>
                  );
                })}
              </div>
              
              <div className="grid grid-cols-12 gap-1 mb-2">
                {/* Row 2: 2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35 */}
                {[2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35].map((num) => {
                  const color = getNumberColor(num);
                  return (
                    <button
                      key={num}
                      onClick={() => addBet("number", num)}
                      className={`${
                        color === 'red' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-900 hover:bg-gray-800'
                      } text-white p-2 rounded text-sm font-bold h-12 relative`}
                    >
                      {num}
                      {selectedBets[`number-${num}`] && renderChipOnBet(`number-${num}`, selectedBets[`number-${num}`])}
                    </button>
                  );
                })}
              </div>
              
              <div className="grid grid-cols-12 gap-1 mb-3">
                {/* Row 3: 1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34 */}
                {[1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34].map((num) => {
                  const color = getNumberColor(num);
                  return (
                    <button
                      key={num}
                      onClick={() => addBet("number", num)}
                      className={`${
                        color === 'red' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-900 hover:bg-gray-800'
                      } text-white p-2 rounded text-sm font-bold h-12 relative`}
                    >
                      {num}
                      {selectedBets[`number-${num}`] && renderChipOnBet(`number-${num}`, selectedBets[`number-${num}`])}
                    </button>
                  );
                })}
              </div>

              {/* Column Bets */}
              <div className="grid grid-cols-4 gap-1 mb-3">
                <button
                  onClick={() => addBet("column", 1)}
                  className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded text-xs font-bold col-span-1 relative"
                >
                  1 to 12
                  {selectedBets["column-1"] && renderChipOnBet("column-1", selectedBets["column-1"])}
                </button>
                <button
                  onClick={() => addBet("column", 2)}
                  className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded text-xs font-bold col-span-1 relative"
                >
                  13 to 24
                  {selectedBets["column-2"] && renderChipOnBet("column-2", selectedBets["column-2"])}
                </button>
                <button
                  onClick={() => addBet("column", 3)}
                  className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded text-xs font-bold col-span-1 relative"
                >
                  25 to 36
                  {selectedBets["column-3"] && renderChipOnBet("column-3", selectedBets["column-3"])}
                </button>
                <div className="col-span-1">
                  <button
                    onClick={() => addBet("2to1-top")}
                    className="bg-gray-700 hover:bg-gray-600 text-white p-1 rounded text-xs font-bold w-full h-8 relative"
                  >
                    2:1
                    {selectedBets["2to1-top"] && renderChipOnBet("2to1-top", selectedBets["2to1-top"])}
                  </button>
                </div>
              </div>

              {/* Outside Bets */}
              <div className="grid grid-cols-6 gap-1">
                <button
                  onClick={() => addBet("low")}
                  className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded text-sm font-bold relative"
                >
                  1-18
                  {selectedBets["low"] && renderChipOnBet("low", selectedBets["low"])}
                </button>
                <button
                  onClick={() => addBet("even")}
                  className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded text-sm font-bold relative"
                >
                  Even
                  {selectedBets["even"] && renderChipOnBet("even", selectedBets["even"])}
                </button>
                <button
                  onClick={() => addBet("red")}
                  className="bg-red-600 hover:bg-red-700 text-white p-2 rounded text-sm font-bold relative"
                >
                  Red
                  {selectedBets["red"] && renderChipOnBet("red", selectedBets["red"])}
                </button>
                <button
                  onClick={() => addBet("black")}
                  className="bg-gray-900 hover:bg-gray-800 text-white p-2 rounded text-sm font-bold relative"
                >
                  Black
                  {selectedBets["black"] && renderChipOnBet("black", selectedBets["black"])}
                </button>
                <button
                  onClick={() => addBet("odd")}
                  className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded text-sm font-bold relative"
                >
                  Odd
                  {selectedBets["odd"] && renderChipOnBet("odd", selectedBets["odd"])}
                </button>
                <button
                  onClick={() => addBet("high")}
                  className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded text-sm font-bold relative"
                >
                  19-36
                  {selectedBets["high"] && renderChipOnBet("high", selectedBets["high"])}
                </button>
              </div>
            </div>

            {/* Right side 2:1 bets */}
            <div className="flex flex-col gap-1">
              <button
                onClick={() => addBet("2to1-1")}
                className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded text-xs font-bold h-12 w-12 relative"
              >
                2:1
                {selectedBets["2to1-1"] && renderChipOnBet("2to1-1", selectedBets["2to1-1"])}
              </button>
              <button
                onClick={() => addBet("2to1-2")}
                className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded text-xs font-bold h-12 w-12 relative"
              >
                2:1
                {selectedBets["2to1-2"] && renderChipOnBet("2to1-2", selectedBets["2to1-2"])}
              </button>
              <button
                onClick={() => addBet("2to1-3")}
                className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded text-xs font-bold h-12 w-12 relative"
              >
                2:1
                {selectedBets["2to1-3"] && renderChipOnBet("2to1-3", selectedBets["2to1-3"])}
              </button>
            </div>
          </div>
        </div>

        {/* Betting Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <Label className="text-white text-sm">Select Chip Value</Label>
              <div className="flex gap-2 flex-wrap">
                {chipValues.map((value) => (
                  <button
                    key={value}
                    onClick={() => setSelectedChip(value)}
                    className={`w-12 h-12 rounded-full border-2 font-bold text-xs flex items-center justify-center transition-all ${
                      selectedChip === value 
                        ? `${getChipColor(value)} ring-2 ring-white` 
                        : `${getChipColor(value)} opacity-70 hover:opacity-100`
                    }`}
                  >
                    ${value}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="text-white text-sm space-y-2">
              <div className="flex justify-between">
                <span>Selected Chip:</span>
                <span className="font-bold text-casino-gold">${selectedChip}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Bets:</span>
                <span className="font-bold text-green-400">${getTotalBets().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Bets:</span>
                <span className="font-bold text-blue-400">{Object.keys(selectedBets).length}</span>
              </div>
              {lastResult !== null && (
                <div className="flex justify-between">
                  <span>Last Result:</span>
                  <span className={`font-bold ${getNumberColor(lastResult) === 'red' ? 'text-red-500' : getNumberColor(lastResult) === 'green' ? 'text-green-500' : 'text-white'}`}>{lastResult}</span>
                </div>
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
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-10"
              disabled={isSpinning}
            >
              Clear All Bets ({Object.keys(selectedBets).length})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}