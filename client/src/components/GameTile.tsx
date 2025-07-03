import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";

interface GameTileProps {
  game: {
    id: string;
    name: string;
    description: string;
    icon: string;
    path: string;
    color: string;
    status: string;
    players: number;
    lastValue: string;
    valueLabel: string;
  };
}

export default function GameTile({ game }: GameTileProps) {
  const [, setLocation] = useLocation();

  return (
    <Card
      className="game-tile casino-bg-blue border-casino-gold/20 hover:border-casino-gold/50 cursor-pointer"
      onClick={() => setLocation(game.path)}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-casino-gold text-3xl">
            <span className={game.id === "crash" ? "crash-rocket" : game.id === "dice" ? "animate-float" : ""}>
              {game.icon}
            </span>
          </div>
          <div className="text-right">
            <div className="casino-gold font-semibold">{game.name}</div>
            <div className="text-sm text-gray-400">{game.description}</div>
          </div>
        </div>
        <div className="text-4xl font-bold mb-2">{game.lastValue}</div>
        <div className="text-sm text-gray-400">{game.valueLabel}</div>
        <div className="mt-4 flex items-center justify-between">
          <span className={`text-${game.color}`}>{game.status}</span>
          <span className="text-sm">{game.players} playing</span>
        </div>
      </CardContent>
    </Card>
  );
}
