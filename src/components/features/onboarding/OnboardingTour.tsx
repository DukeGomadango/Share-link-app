"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function OnboardingTour() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 初回アクセスと見なし、少し遅れて表示する
    const timer = setTimeout(() => setIsVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="fixed bottom-8 right-8 z-50 max-w-sm"
        >
          <GlassCard className="relative p-6 border-emerald-500/40 shadow-2xl shadow-emerald-500/20 bg-background/80 backdrop-blur-xl">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-3 right-3 h-6 w-6 rounded-full text-muted-foreground hover:bg-muted"
              onClick={() => setIsVisible(false)}
            >
              <X className="w-4 h-4" />
            </Button>
            
            <div className="flex items-start space-x-4">
              <div className="p-2.5 bg-emerald-500/20 rounded-full text-emerald-500 mt-1 shadow-inner shadow-emerald-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-lg mb-1.5 tracking-tight">Welcome to Digital Return MVP!</h3>
                <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                  Try it out! Drag a file from your <strong>File Pool</strong> into a <strong>Recipient Card</strong>. 
                  A secure, unique claim link will be generated automatically. ✨
                </p>
                <Button size="sm" className="w-full bg-emerald-500 hover:bg-emerald-600 rounded-full text-white shadow-md shadow-emerald-500/20 transition-transform active:scale-95" onClick={() => setIsVisible(false)}>
                  Got it, let's go!
                </Button>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
