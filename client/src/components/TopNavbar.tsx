import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Diamond, Wallet, Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import WalletModal from "./WalletModal";
import bitjackzLogo from "@assets/bitjackz logo_1751569851580.png";

export default function TopNavbar() {
  const [showWallet, setShowWallet] = useState(false);

  const { data: balance } = useQuery<{ balance: number }>({
    queryKey: ["/api/balance"],
  });

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 casino-bg-blue/95 backdrop-blur-md border-b border-casino-gold/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img 
                  src={bitjackzLogo} 
                  alt="BitJackz" 
                  className="w-8 h-8 object-contain"
                />
                <div className="text-2xl font-bold casino-gold">
                  BitJackz
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="balance-glow bg-casino-gold/20 px-4 py-2 rounded-lg flex items-center space-x-2">
                <Wallet className="casino-gold" size={16} />
                <span className="font-semibold">
                  ${balance?.balance.toFixed(2) || "0.00"}
                </span>
              </div>
              <Button
                onClick={() => setShowWallet(true)}
                className="bg-casino-gold hover:bg-casino-gold/90 text-casino-navy font-semibold"
              >
                <Plus className="mr-2" size={16} />
                Deposit
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="casino-gold hover:text-white"
              >
                <User size={24} />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <WalletModal 
        isOpen={showWallet} 
        onClose={() => setShowWallet(false)} 
        currentBalance={balance?.balance || 0}
      />
    </>
  );
}
