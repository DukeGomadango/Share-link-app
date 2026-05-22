"use client";

import { useEffect, useState } from "react";
import { 
  Sheet, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetBody
} from "@/components/ui/sheet";
import { Gift, ChevronRight, History, Loader2, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

import { useTranslation } from "@/lib/i18n";

type RelatedClaim = {
  token: string;
  name: string;
  status: string;
  date: string;
};

type Props = {
  currentToken: string;
  isOpen: boolean;
  onClose: () => void;
};

export function CollectionDrawer({ currentToken, isOpen, onClose }: Props) {
  const { t } = useTranslation();
  const [claims, setClaims] = useState<RelatedClaim[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !currentToken) return;
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setLoading(true);
      try {
        const r = await fetch(`/api/claim/${encodeURIComponent(currentToken)}/related`);
        if (!r.ok) return;
        const data = (await r.json()) as { claims?: RelatedClaim[] };
        if (!cancelled) setClaims(data.claims || []);
      } catch (e) {
        console.error("Failed to load collection:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, currentToken]);

  return (
    <Sheet isOpen={isOpen} onClose={onClose}>
      <SheetHeader>
        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4">
          <Gift className="w-6 h-6 text-emerald-600" />
        </div>
        <SheetTitle>{t.claim.collectionTitle}</SheetTitle>
        <SheetDescription>
          {t.claim.collectionSubtitle}
        </SheetDescription>
      </SheetHeader>

      <SheetBody>
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-emerald-600/40">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-xs font-bold">{t.common.loading}</p>
            </div>
          ) : claims.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                <History className="w-8 h-8 text-emerald-100" />
              </div>
              <p className="text-sm font-bold text-emerald-900/40">{t.claim.noOtherGifts}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700/50 px-1">{t.claim.pastGifts}</p>
              <div className="grid gap-3">
                <AnimatePresence mode="popLayout">
                  {claims.map((claim, idx) => (
                    <motion.div
                      key={claim.token}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Link
                        href={`/claim/${claim.token}`}
                        onClick={onClose}
                        className="group block p-4 bg-white hover:bg-emerald-500 border border-emerald-100 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-emerald-200/50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-emerald-950 group-hover:text-white transition-colors truncate max-w-[200px]">
                              {claim.name}
                            </p>
                            <p className="text-[10px] font-medium text-emerald-600/60 group-hover:text-white/70 transition-colors">
                              {new Date(claim.date).toLocaleDateString()}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-emerald-200 group-hover:text-white transition-colors" />
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </SheetBody>

      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent pt-12">
        <Link href="/claim/me" onClick={onClose} className="block">
          <button className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200/50 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group">
            <LayoutGrid className="w-4 h-4" />
            <span>すべてのコレクションを見る</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </Link>
        <p className="mt-4 text-[10px] text-center text-emerald-900/30 leading-relaxed font-medium">
          {t.claim.collectionNotice}
        </p>
      </div>
    </Sheet>
  );
}
