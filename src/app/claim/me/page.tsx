"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, ChevronRight, Clock, Box, FileText, Music, Image as ImageIcon, FileCode, Sparkles } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { GlassCard } from "@/components/shared/GlassCard";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ListenerCampaign {
  id: string;
  name: string;
  expiresAt: string | null;
  isUnread: boolean;
  claims: {
    token: string;
    createdAt: string;
    isUnread: boolean;
  }[];
  previews: {
    name: string;
    mimeType: string;
    url?: string | null;
  }[];
}

/**
 * ファイルの種類に応じたアイコンを返却
 */
function FileIcon({ mimeType, className }: { mimeType: string; className?: string }) {
  if (mimeType.startsWith("image/")) return <ImageIcon className={className} />;
  if (mimeType.startsWith("audio/")) return <Music className={className} />;
  if (mimeType.startsWith("video/")) return <FileCode className={className} />;
  return <FileText className={className} />;
}

interface Preview {
  name: string;
  mimeType: string;
  url?: string | null;
}

/**
 * ビジュアル・スタック（重なり）コンポーネント
 */
function VisualStack({ previews, size = "md" }: { previews: Preview[]; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16 md:w-20 md:h-20"
  };

  if (previews.length === 0) {
    return (
      <div className={cn("rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-200", sizeClasses[size])}>
        <Gift className="w-1/2 h-1/2" />
      </div>
    );
  }

  return (
    <div className="flex -space-x-3 md:-space-x-5">
      {previews.slice(0, 3).map((p, i) => (
        <motion.div
          key={i}
          initial={{ rotate: -5 * i }}
          whileHover={{ y: -5, rotate: 0, zIndex: 50 }}
          className={cn(
            "relative rounded-2xl bg-white border border-emerald-100 shadow-xl flex items-center justify-center text-emerald-500 overflow-hidden shrink-0",
            sizeClasses[size],
            i === 0 ? "z-30" : i === 1 ? "z-20 scale-95" : "z-10 scale-90"
          )}
        >
          {p.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={p.url} 
              alt={p.name} 
              className="w-full h-full object-cover transition-transform group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-white to-emerald-50/30" />
              <FileIcon mimeType={p.mimeType} className="w-1/2 h-1/2 relative z-10" />
            </>
          )}
        </motion.div>
      ))}
      {previews.length > 3 && (
        <div className={cn("rounded-2xl bg-emerald-950 text-white flex items-center justify-center text-[10px] font-black z-0 border-2 border-white", sizeClasses[size])}>
          +{previews.length - 3}
        </div>
      )}
    </div>
  );
}

export default function ListenerDashboardPage() {
  const { t } = useTranslation();
  const [campaigns, setCampaigns] = useState<ListenerCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/claim/me")
      .then((r) => r.json())
      .then((data) => {
        setCampaigns(data.campaigns || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const heroCampaign = campaigns[0];
  const otherCampaigns = campaigns.slice(1);

  return (
    <div className="min-h-screen bg-[#fafafa] text-emerald-950 font-sans selection:bg-emerald-100 selection:text-emerald-900 pb-20">
      {/* 背景装飾 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-emerald-100/50 blur-[120px]" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] rounded-full bg-sky-100/40 blur-[100px]" />
      </div>

      <main className="relative max-w-5xl mx-auto px-6 py-12 md:py-20">
        {/* ヘッダー */}
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-emerald-600 font-bold tracking-wider text-[10px] uppercase"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t.portal.portalLabel}
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-black tracking-tighter"
            >
              {t.portal.title}
            </motion.h1>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
            <p className="text-[10px] font-black text-emerald-900/20 uppercase tracking-[0.3em]">{t.portal.synchronizing}</p>
          </div>
        ) : campaigns.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-32 px-6 text-center"
          >
            <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-xl shadow-emerald-200/20 flex items-center justify-center mb-8 border border-emerald-50">
              <Box className="w-10 h-10 text-emerald-100" />
            </div>
            <h2 className="text-2xl font-bold text-emerald-900/80 mb-2">{t.portal.emptyTitle}</h2>
            <p className="text-emerald-900/40 max-w-sm text-sm">{t.portal.emptyDescription}</p>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* HERO CARD (最新のキャンペーン) */}
            <AnimatePresence>
              {heroCampaign && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="col-span-full"
                >
                  <Link href={`/claim/${heroCampaign.claims[0].token}`}>
                    <GlassCard className={cn(
                      "relative overflow-hidden p-8 md:p-12 group transition-all duration-700 cursor-pointer shadow-2xl shadow-emerald-200/20",
                      heroCampaign.isUnread ? "border-emerald-400 ring-2 ring-emerald-500/10 ring-offset-0" : "hover:border-emerald-500/50"
                    )}>
                      {/* 装飾用背景 */}
                      <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-emerald-500/10 to-transparent blur-3xl group-hover:from-emerald-500/20 transition-all duration-700" />
                      
                      {/* NEW バッジ */}
                      {heroCampaign.isUnread && (
                        <div className="absolute top-6 right-6 z-20 flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg animate-bounce">
                          <Sparkles className="w-3 h-3" />
                          NEW
                        </div>
                      )}

                      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-12">
                        <div className="space-y-6 flex-1">
                          <div className="flex items-center gap-3">
                            <Badge className="bg-emerald-600 text-white border-none px-3 py-1 text-[10px] font-black tracking-widest uppercase">{t.portal.latestGift}</Badge>
                            {heroCampaign.expiresAt && (
                              <span className="text-[10px] font-bold text-emerald-900/40 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {t.portal.until.replace("{date}", new Date(heroCampaign.expiresAt).toLocaleDateString())}
                              </span>
                            )}
                          </div>
                          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-emerald-950 group-hover:text-emerald-600 transition-colors duration-500">
                            {heroCampaign.name}
                          </h2>
                          <div className="flex items-center gap-4 md:gap-8">
                             <VisualStack previews={heroCampaign.previews} size="lg" />
                             <div className="h-10 w-[1px] bg-emerald-100 hidden md:block shrink-0" />
                             <div className="space-y-1 min-w-0">
                               <p className="text-[10px] font-black text-emerald-900/20 uppercase tracking-[0.2em] whitespace-nowrap">{t.portal.receivedContents}</p>
                               <p className="text-sm font-bold text-emerald-900/60 whitespace-nowrap">{t.portal.itemsCount.replace("{count}", String(heroCampaign.claims.length))}</p>
                             </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 shrink-0">
                           <span className="text-sm font-black text-emerald-600/60 uppercase tracking-widest group-hover:translate-x-[-8px] transition-transform duration-500 whitespace-nowrap hidden sm:block">{t.portal.viewCollection}</span>
                           <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-500 shrink-0">
                             <ChevronRight className="w-8 h-8" />
                           </div>
                        </div>
                      </div>
                    </GlassCard>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            {/* SECONDARY GRID (2件目以降) */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              <AnimatePresence>
                {otherCampaigns.map((campaign, idx) => (
                  <motion.div
                    key={campaign.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + idx * 0.05 }}
                  >
                    <Link href={`/claim/${campaign.claims[0].token}`}>
                      <GlassCard className={cn(
                        "h-full p-5 md:p-6 group transition-all duration-500 cursor-pointer relative overflow-hidden flex flex-col justify-between",
                        campaign.isUnread ? "border-emerald-400" : "hover:border-emerald-500/50"
                      )}>
                        {/* 通知ドット */}
                        {campaign.isUnread && (
                          <div className="absolute top-3 right-3 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
                        )}

                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <VisualStack previews={campaign.previews} size="sm" />
                            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <h3 className={cn(
                              "text-sm md:text-base font-bold tracking-tight line-clamp-2 leading-tight transition-colors",
                              campaign.isUnread ? "text-emerald-700" : "text-emerald-950 group-hover:text-emerald-600"
                            )}>
                              {campaign.name}
                            </h3>
                            <p className="text-[9px] font-black text-emerald-900/20 uppercase tracking-wider">
                              {t.portal.itemsCountCompact.replace("{count}", String(campaign.claims.length))}
                            </p>
                          </div>
                        </div>
                      </GlassCard>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-bold border", className)}>
      {children}
    </span>
  );
}
