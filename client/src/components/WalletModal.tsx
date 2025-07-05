import { X, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
}

export default function WalletModal({ isOpen, onClose, currentBalance }: WalletModalProps) {
  const recentTransactions = [
    { type: "win", description: "Crash Win", amount: 156.78 },
    { type: "deposit", description: "Deposit", amount: 500.00 },
    { type: "loss", description: "Roulette Loss", amount: -25.00 },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="casino-bg-blue border-casino-gold/20 text-white max-w-[90vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="casino-gold text-lg sm:text-xl">Wallet</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-casino-navy/50 rounded-lg p-4">
            <div className="text-sm text-gray-400">Current Balance</div>
            <div className="text-2xl font-bold casino-gold">${currentBalance.toFixed(2)}</div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Button className="bg-casino-gold hover:bg-casino-gold/90 text-casino-navy font-semibold">
              <Plus className="mr-2" size={16} />
              Deposit
            </Button>
            <Button className="bg-casino-purple hover:bg-casino-purple/90 text-white font-semibold">
              <Minus className="mr-2" size={16} />
              Withdraw
            </Button>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold casino-gold">Recent Transactions</h4>
            {recentTransactions.map((transaction, index) => (
              <div key={index} className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-400">{transaction.description}</span>
                <span className={`font-semibold ${
                  transaction.type === "win" ? "text-green-400" :
                  transaction.type === "deposit" ? "casino-gold" : "text-red-400"
                }`}>
                  {transaction.amount > 0 ? "+" : ""}${transaction.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
