"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ClaimAuthView } from "@/components/features/claim/ClaimAuthView";
import { ClaimUnopenedView } from "@/components/features/claim/ClaimUnopenedView";
import { ClaimContentView } from "@/components/features/claim/ClaimContentView";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ClaimFile } from "@/components/features/claim/types";

const pageVariants = {
  initial: { opacity: 0, scale: 0.96, y: 12 },
  enter: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: -8,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 1, 1] as const,
    },
  },
};

const unboxVariants = {
  initial: { opacity: 0, scale: 0.9, rotateX: -8 },
  enter: {
    opacity: 1,
    scale: 1,
    rotateX: 0,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1] as const,
      staggerChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    scale: 1.05,
    y: -20,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 1, 1] as const,
    },
  },
};

export default function ClaimPage() {
  const params = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const token = typeof params?.token === "string" ? params.token : "";
  const isPreview = searchParams?.get("preview") === "true";
  
  const [isAuthenticated, setIsAuthenticated] = useState(isPreview);
  const [isOpened, setIsOpened] = useState(false);
  const [bundle, setBundle] = useState<{
    expiryIso: string;
    campaignName: string;
    campaignId?: string;
    files: ClaimFile[];
  } | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimLoading, setClaimLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // リアルタイム監視 (Supabase Realtime)
  useEffect(() => {
    if (!token) return;

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`claim-token-updates-${token}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "claims",
          filter: `claim_secret=eq.${token}`,
        },
        async () => {
          // 更新があったらデータを再取得
          try {
            const r = await fetch(`/api/claim/${encodeURIComponent(token)}?t=${Date.now()}`, { cache: "no-store" });
            if (!r.ok) return;
            const data = await r.json();
            if (data.files && data.files.length > 0) {
              const files: ClaimFile[] = data.files.map((f: any) => ({
                id: f.id,
                type: (f.type === "audio" || f.type === "image" || f.type === "file") ? f.type : "file",
                src: f.src,
                filename: f.filename,
                title: f.title,
              }));
              setBundle({ 
                expiryIso: data.expiryIso, 
                campaignName: data.campaignName, 
                campaignId: data.campaignId,
                files 
              });
            }
          } catch (e) {
            console.error("Refetch failed", e);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [token, bundle]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setClaimLoading(true);
      setClaimError(null);
      try {
        const r = await fetch(`/api/claim/${encodeURIComponent(token)}?t=${Date.now()}`, { cache: "no-store" });
        if (!r.ok) {
          if (r.status === 404) {
            setClaimError("ギフトが見つかりません。URLが正しいか確認してください。");
          } else {
            throw new Error(String(r.status));
          }
          return;
        }
        const data = (await r.json()) as {
          expiryIso: string;
          campaignName: string;
          campaignId?: string;
          files: Array<{
            id: string;
            type: string;
            src: string;
            filename: string;
            title: string;
          }>;
        };
        const files: ClaimFile[] = data.files.map((f) => ({
          id: f.id,
          type: (f.type === "audio" || f.type === "image" || f.type === "file") ? f.type : "file",
          src: f.src,
          filename: f.filename,
          title: f.title,
        }));
        if (!cancelled) {
          setBundle({ 
            expiryIso: data.expiryIso, 
            campaignName: data.campaignName, 
            campaignId: data.campaignId,
            files 
          });
        }
      } catch {
        if (!cancelled) setClaimError("データの読み込みに失敗しました");
      } finally {
        if (!cancelled) setClaimLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleAuth = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsAuthenticated(true);
      setIsVerifying(false);
    }, 1500);
  };

  const phaseKey = !isAuthenticated ? "auth" : !isOpened ? "unopened" : "content";

  const expiryDate = bundle
    ? new Date(bundle.expiryIso)
    : (() => {
        const d = new Date();
        d.setDate(d.getDate() + 3);
        return d;
      })();

  return (
    <AnimatePresence mode="wait">
      {phaseKey === "auth" && (
        <motion.div
          key="auth"
          variants={pageVariants}
          initial="initial"
          animate="enter"
          exit="exit"
          className="w-full"
        >
          <ClaimAuthView onVerify={handleAuth} isVerifying={isVerifying} />
        </motion.div>
      )}

      {phaseKey === "unopened" && (
        <motion.div
          key="unopened"
          variants={pageVariants}
          initial="initial"
          animate="enter"
          exit="exit"
          className="w-full"
        >
          {claimLoading && !bundle ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
              <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-muted-foreground text-sm">ギフトを確認中...</p>
            </div>
          ) : (
            <ClaimUnopenedView 
              onOpen={() => setIsOpened(true)} 
              expiryDate={expiryDate} 
              campaignName={bundle?.campaignName}
            />
          )}
        </motion.div>
      )}

      {phaseKey === "content" && (
        <motion.div
          key="content"
          variants={unboxVariants}
          initial="initial"
          animate="enter"
          exit="exit"
          className="w-full"
          style={{ perspective: "1200px" }}
        >
          {claimError && (
            <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-2">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold">読み込みに失敗しました</h2>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">{claimError}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 px-6 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors text-sm font-medium"
              >
                再読み込み
              </button>
            </div>
          )}
          {claimLoading && !claimError && (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
              <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-muted-foreground text-sm">コンテンツを準備中...</p>
            </div>
          )}
          {!claimLoading && bundle && !claimError && (
            <ClaimContentView 
              files={bundle.files} 
              expiryDate={new Date(bundle.expiryIso)} 
              campaignName={bundle.campaignName}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
