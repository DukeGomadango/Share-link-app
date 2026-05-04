"use client";

import { Fingerprint } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ClaimAuthViewProps {
  onVerify: () => void;
  isVerifying?: boolean;
}

export function ClaimAuthView({ onVerify, isVerifying = false }: ClaimAuthViewProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-10">
      {/* 指紋アイコン: 穏やかなパルスで「ここをタップ」と誘導 */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center ring-4 ring-emerald-500/20 shadow-[-0_0_60px_#10B98133] relative",
          isVerifying && "ring-emerald-500/40"
        )}
      >
        {isVerifying && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-2 border-t-emerald-500 border-r-transparent border-b-transparent border-l-transparent"
          />
        )}
        <motion.div
          animate={isVerifying ? { scale: [1, 1.15, 1], opacity: [1, 0.7, 1] } : { scale: [1, 1.08, 1] }}
          transition={{ duration: isVerifying ? 1 : 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Fingerprint className={cn("w-10 h-10 transition-colors", isVerifying ? "text-emerald-400" : "text-emerald-500")} />
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
          disabled={isVerifying}
          className="rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white px-8 h-14 text-lg backdrop-blur-md shadow-[0_0_20px_oklch(0.645_0.165_158.452/0.2)] border border-emerald-500/50 transition-all hover:scale-105 min-w-[200px]"
        >
          {isVerifying ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-3" />
          ) : (
            <Fingerprint className="w-5 h-5 mr-3" />
          )}
          {isVerifying ? "認証中..." : t.claim.verifyIdentity}
        </Button>
      </motion.div>
    </div>
  );
}
