import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramAuthProps {
  onAuthSuccess: (user: any) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: {
          user?: TelegramUser;
          auth_date?: number;
          hash?: string;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        isExpanded: boolean;
      };
    };
  }
}

export default function TelegramAuth({ onAuthSuccess }: TelegramAuthProps) {
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);

  const authMutation = useMutation({
    mutationFn: async (telegramData: any) => {
      const response = await apiRequest("POST", "/api/auth/telegram", { telegramData });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        onAuthSuccess(data.user);
        queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
        toast({
          title: "Welcome to BitJackz!",
          description: `Hello ${data.user.username}! Ready to play?`,
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Authentication Failed",
        description: "Failed to authenticate with Telegram",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const initTelegramAuth = () => {
      // Check if running in Telegram WebApp
      if (window.Telegram?.WebApp) {
        const webApp = window.Telegram.WebApp;
        webApp.ready();
        webApp.expand();
        
        // Get user data from Telegram WebApp
        const user = webApp.initDataUnsafe.user;
        
        if (user) {
          console.log("Telegram user found:", user);
          authMutation.mutate(user);
        } else {
          console.log("No Telegram user, using demo");
          // Fallback for demo purposes
          authMutation.mutate({
            id: 1,
            username: "demo_user",
            first_name: "Demo",
            last_name: "User"
          });
        }
        
        setIsInitialized(true);
      } else {
        console.log("Not in Telegram WebApp, using demo user");
        // Not in Telegram WebApp, use demo user
        authMutation.mutate({
          id: 1,
          username: "demo_user",
          first_name: "Demo",
          last_name: "User"
        });
        setIsInitialized(true);
      }
    };

    // Initialize after a short delay to ensure Telegram WebApp is loaded
    const timer = setTimeout(initTelegramAuth, 500);
    
    return () => clearTimeout(timer);
  }, []);

  if (!isInitialized || authMutation.isPending) {
    return (
      <div className="fixed inset-0 bg-casino-navy flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-bold casino-gold mb-4 animate-pulse">
            BitJackz
          </div>
          <div className="text-gray-400">
            {authMutation.isPending ? "Authenticating..." : "Initializing..."}
          </div>
        </div>
      </div>
    );
  }

  return null;
}