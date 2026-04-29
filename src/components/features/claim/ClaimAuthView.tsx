"use client";

import { Fingerprint } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

interface ClaimAuthViewProps {
  onVerify: () => void;
}

export function ClaimAuthView({ onVerify }: ClaimAuthViewProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-10">
      {/* 指紋アイコン: 穏やかなパルスで「ここをタップ」と誘導 */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center ring-4 ring-emerald-500/20 shadow-[-0_0_60px_#10B98133]"
      >
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Fingerprint className="w-10 h-10 text-emerald-500" />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="space-y-3"
      >
        <h1 className="text-2xl font-bold tracking-tight">{t.claim.secureContent}</h1>
        <p className="text-muted-foreground/80 max-w-[250px] mx-auto text-sm leading-relaxed">
          {t.claim.authDescription}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Button
          onClick={onVerify}
          className="rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white px-8 h-14 text-lg backdrop-blur-md shadow-[0_0_20px_oklch(0.645_0.165_158.452/0.2)] border border-emerald-500/50 transition-all hover:scale-105"
        >
          <Fingerprint className="w-5 h-5 mr-3" />
          {t.claim.verifyIdentity}
        </Button>
      </motion.div>
    </div>
  );
}
