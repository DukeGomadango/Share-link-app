"use client";

import { Gift } from "lucide-react";
import { motion } from "framer-motion";
import { CountdownBadge } from "@/components/shared/CountdownBadge";
import { useTranslation } from "@/lib/i18n";

interface ClaimUnopenedViewProps {
  onOpen: () => void;
  expiryDate: Date;
  campaignName?: string;
  isLoading?: boolean;
  isEmpty?: boolean;
}

export function ClaimUnopenedView({ onOpen, expiryDate, campaignName, isLoading, isEmpty }: ClaimUnopenedViewProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-12">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="space-y-5 flex flex-col items-center"
      >
        <CountdownBadge expiresAt={expiryDate} />
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-600">
          {t.claim.receivedGift}
        </h1>
        <p className="text-muted-foreground/80 text-sm">
          {t.claim.from.replace("{sender}", campaignName || "特別な贈り物")}
        </p>
      </motion.div>

      {/* ギフトボックス: タップで「開封」する体験 */}
      <motion.button
        onClick={onOpen}
        disabled={isEmpty || isLoading}
        className={`relative group focus:outline-none ${(isEmpty || isLoading) ? "cursor-wait" : ""}`}
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        whileHover={!(isEmpty || isLoading) ? { scale: 1.05, rotate: -3 } : {}}
        whileTap={!(isEmpty || isLoading) ? { scale: 0.95 } : {}}
      >
        {/* グロー背景 */}
        <motion.div
          className={`absolute -inset-6 blur-2xl rounded-full pointer-events-none ${isEmpty ? "bg-amber-500/20" : "bg-emerald-500/30"}`}
          animate={{ opacity: [0.5, 0.8, 0.5], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* ボックス本体 */}
        <div className={`relative w-44 h-44 bg-gradient-to-br rounded-3xl flex items-center justify-center shadow-2xl ${
          isEmpty 
            ? "from-slate-400 to-slate-500 shadow-slate-500/30" 
            : "from-emerald-400 to-emerald-600 shadow-emerald-500/50"
        }`}>
          {isLoading ? (
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isEmpty ? (
            <div className="relative">
              <Gift className="w-20 h-20 text-white/50" strokeWidth={1.5} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
          ) : (
            <Gift className="w-20 h-20 text-white" strokeWidth={1.5} />
          )}
        </div>

        <motion.p
          className={`mt-8 text-sm font-bold tracking-[0.2em] uppercase ${isEmpty ? "text-slate-400" : "text-emerald-500"}`}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {isEmpty ? "コンテンツを準備中..." : t.claim.tapToOpen}
        </motion.p>
      </motion.button>
    </div>
  );
}
