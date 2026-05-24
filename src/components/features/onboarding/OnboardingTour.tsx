"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/lib/i18n";

export function OnboardingTour() {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
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
          className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] left-4 right-4 z-40 mx-auto max-w-sm sm:bottom-8 sm:left-auto sm:right-8 lg:bottom-8 lg:right-8"
        >
          <GlassCard className="relative border-emerald-500/40 bg-background/80 p-6 shadow-2xl shadow-emerald-500/20 backdrop-blur-xl">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 size-11 rounded-full text-muted-foreground hover:bg-muted"
              onClick={() => setIsVisible(false)}
              aria-label={t.common.cancel}
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="flex items-start space-x-4">
              <div className="mt-1 rounded-full bg-emerald-500/20 p-2.5 text-emerald-500 shadow-inner shadow-emerald-500/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="mb-1.5 text-lg font-semibold tracking-tight text-foreground">
                  {t.onboarding.title}
                </h3>
                <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
                  {t.onboarding.description}
                </p>
                <Button
                  size="touch"
                  className="w-full rounded-full bg-emerald-500 text-white shadow-md shadow-emerald-500/20 transition-transform hover:bg-emerald-600 active:scale-95"
                  onClick={() => setIsVisible(false)}
                >
                  {t.onboarding.gotIt}
                </Button>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
