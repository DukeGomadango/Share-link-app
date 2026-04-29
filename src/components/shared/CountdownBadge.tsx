"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

export function CountdownBadge({ expiresAt }: { expiresAt: Date }) {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState("");
  const [urgencyLevel, setUrgencyLevel] = useState<"normal" | "warning" | "expired">("normal");

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = expiresAt.getTime() - now;

      if (difference <= 0) {
        setTimeLeft(t.countdown.expired);
        setUrgencyLevel("expired");
        return;
      }

      // 残り1日以下で「warning」（赤ではなくアンバー系で穏やかに通知）
      if (difference < 1000 * 60 * 60 * 24) {
        setUrgencyLevel("warning");
      } else {
        setUrgencyLevel("normal");
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(
          t.countdown.daysLeft
            .replace("{days}", days.toString())
            .replace("{hours}", hours.toString())
        );
      } else {
        setTimeLeft(
          t.countdown.hoursLeft
            .replace("{hours}", hours.toString())
            .replace("{minutes}", minutes.toString())
        );
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 60000);
    return () => clearInterval(timer);
  }, [expiresAt, t.countdown]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Remaining time: ${timeLeft}`}
      className={cn(
        "inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md border shadow-lg transition-colors duration-500",
        // Calm UI: 焦燥感を抑えたトーンで配置
        urgencyLevel === "expired" && "bg-muted/50 text-muted-foreground border-border/30",
        urgencyLevel === "warning" && "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25",
        urgencyLevel === "normal" && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 border-white/10"
      )}
    >
      <Clock className="w-3.5 h-3.5" />
      <span>{timeLeft}</span>
    </div>
  );
}
