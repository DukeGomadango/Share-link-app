"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function CountdownBadge({ expiresAt }: { expiresAt: Date }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = expiresAt.getTime() - now;

      if (difference <= 0) {
        setTimeLeft("Expired");
        setIsUrgent(true);
        return;
      }

      setIsUrgent(difference < 1000 * 60 * 60 * 24); // 残り1日以下で緊急表示

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) setTimeLeft(`${days}d ${hours}h left`);
      else setTimeLeft(`${hours}h ${minutes}m left`);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 60000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  return (
    <div className={cn(
      "inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md border border-white/10 shadow-lg",
      isUrgent ? "bg-red-500/20 text-red-500 animate-pulse border-red-500/30" : "bg-emerald-500/20 text-emerald-500 border-emerald-500/30"
    )}>
      <Clock className="w-3.5 h-3.5" />
      <span>{timeLeft}</span>
    </div>
  );
}
