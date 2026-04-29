"use client";

import { Gift } from "lucide-react";
import { motion } from "framer-motion";
import { CountdownBadge } from "@/components/shared/CountdownBadge";
import { useTranslation } from "@/lib/i18n";

interface ClaimUnopenedViewProps {
  onOpen: () => void;
  expiryDate: Date;
}

export function ClaimUnopenedView({ onOpen, expiryDate }: ClaimUnopenedViewProps) {
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
          {t.claim.from.replace("{sender}", "Spring Voice Gacha 2026")}
        </p>
      </motion.div>

      {/* ギフトボックス: タップで「開封」する体験 */}
      <motion.button
        onClick={onOpen}
        className="relative group focus:outline-none"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ scale: 1.05, rotate: -3 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* グロー背景 */}
        <motion.div
          className="absolute -inset-6 bg-emerald-500/30 blur-2xl rounded-full pointer-events-none"
          animate={{ opacity: [0.5, 0.8, 0.5], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* ボックス本体 */}
        <div className="relative w-44 h-44 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/50">
          <Gift className="w-20 h-20 text-white" strokeWidth={1.5} />
        </div>

        <motion.p
          className="mt-8 text-sm font-bold tracking-[0.2em] text-emerald-500 uppercase"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {t.claim.tapToOpen}
        </motion.p>
      </motion.button>
    </div>
  );
}
