"use client";

import { AlertTriangle, ChevronRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface LibraryRetentionBannerProps {
  expiringSoonCount: number;
  totalFiles: number;
}

export function LibraryRetentionBanner({ expiringSoonCount, totalFiles }: LibraryRetentionBannerProps) {
  if (expiringSoonCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-8 p-1 bg-gradient-to-r from-amber-500/20 via-red-500/20 to-amber-500/20 rounded-3xl border border-amber-500/20 shadow-lg shadow-amber-500/5 overflow-hidden"
      >
        <div className="bg-background/40 backdrop-blur-md rounded-[1.4rem] px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2 justify-center md:justify-start">
                ファイルの保持期限が近づいています
                <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] uppercase tracking-wider font-black">
                  Important
                </span>
              </h3>
              <p className="text-sm text-amber-700/70 dark:text-amber-400/70">
                ライブラリ内の {totalFiles} 件中 <span className="font-bold text-red-500">{expiringSoonCount} 件</span> があと14日以内に自動消去されます。
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button 
              variant="outline" 
              className="flex-1 md:flex-none border-amber-500/30 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold"
            >
              対象を確認
            </Button>
            <Button 
              className="flex-1 md:flex-none bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-white font-bold shadow-lg shadow-amber-500/20 group"
            >
              <Zap className="w-4 h-4 mr-2 fill-current" />
              Proプランで無期限に
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
