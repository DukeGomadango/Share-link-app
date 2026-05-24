"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ClaimUnopenedView } from "@/components/features/claim/ClaimUnopenedView";
import { ClaimContentView } from "@/components/features/claim/ClaimContentView";
import { PasskeyRegisterCard } from "@/components/features/claim/PasskeyRegisterCard";
import { CollectionDrawer } from "@/components/features/claim/CollectionDrawer";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { debounce } from "@/lib/utils";
import { Gift } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
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
  const { t } = useTranslation();
  const params = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const token = typeof params?.token === "string" ? params.token : "";
  const isPreview = searchParams?.get("preview") === "true";
  
  const [isOpened, setIsOpened] = useState(false);
  const [bundle, setBundle] = useState<{
    expiryIso: string;
    campaignName: string;
    campaignId?: string;
    files: ClaimFile[];
    passkeyLinked?: boolean;
    claimSecret?: string;
    isAuthorized?: boolean;
    authRequired?: boolean;
    displayName?: string;
  } | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimLoading, setClaimLoading] = useState(false);
  const [detectedName, setDetectedName] = useState<string | null>(null);
  const [isCollectionOpen, setIsCollectionOpen] = useState(false);

  // オートリンク（リピーター自動認識）
  useEffect(() => {
    if (!token || isPreview || !bundle || bundle.passkeyLinked) return;

    void (async () => {
      try {
        const r = await fetch(`/api/claim/${encodeURIComponent(token)}/auto-link`, {
          method: "POST",
          credentials: "include",
        });
        if (r.ok) {
          const data = await r.json();
          if (data.ok) {
            setDetectedName(data.detectedName);
            // 紐付けに成功したので、bundle の状態を更新して登録カードを消す
            setBundle((prev) => (prev ? { ...prev, passkeyLinked: true } : null));
          }
        }
      } catch (e) {
        console.error("Auto-link attempt failed", e);
      }
    })();
  }, [token, isPreview, bundle]);

  const refetchBundle = useCallback(async () => {
    if (!token) return;
    try {
      const r = await fetch(`/api/claim/${encodeURIComponent(token)}?t=${Date.now()}`, { cache: "no-store" });
      if (!r.ok) return;
      const data = await r.json();
      if (data.files && data.files.length > 0) {
        const files: ClaimFile[] = data.files.map((f: {
          id: string;
          type: string;
          src: string;
          filename: string;
          title: string;
        }) => ({
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
          files,
          isAuthorized: data.isAuthorized,
          authRequired: data.authRequired,
          passkeyLinked: data.passkeyLinked,
          displayName: data.displayName,
        });
      }
    } catch (e) {
      console.error("Refetch failed", e);
    }
  }, [token]);

  const debouncedRefetch = useMemo(
    () => debounce(() => {
      void refetchBundle();
    }, 500),
    [refetchBundle]
  );

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
        () => {
          // 更新があったらデータを再取得
          debouncedRefetch();
        }
      )
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_type: "recipient",
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [token, debouncedRefetch]);

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
          isAuthorized?: boolean;
          authRequired?: boolean;
          passkeyLinked?: boolean;
          displayName?: string;
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
            files,
            isAuthorized: data.isAuthorized,
            authRequired: data.authRequired,
            passkeyLinked: data.passkeyLinked,
            displayName: data.displayName,
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

  const handleOpen = async () => {
    // ファイルがない場合は開かせない
    if (!bundle || bundle.files.length === 0) return;

    // ステータスを「開封済み」に更新
    try {
      await fetch(`/api/claim/${encodeURIComponent(token)}/claim`, {
        method: "POST",
      });
    } catch (e) {
      console.error("Failed to update status to claimed:", e);
    }
    setIsOpened(true);
  };

  // フェーズ判定のロジックを復元
  const isAuthRequired = bundle?.authRequired && !bundle?.isAuthorized;
  const phaseKey = isAuthRequired ? "auth" : !isOpened ? "unopened" : "content";

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
          <div className="flex flex-col items-center gap-6 py-12 px-6 max-w-md w-full mx-auto">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-500 shadow-inner">
              <Gift className="w-10 h-10" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">{t.claim.secureContent}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t.claim.authDescription}
              </p>
            </div>
            
            {bundle?.campaignId && (
              <PasskeyRegisterCard 
                campaignId={bundle.campaignId} 
                onSuccess={() => window.location.reload()}
              />
            )}
          </div>
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
              onOpen={handleOpen} 
              expiryDate={expiryDate} 
              campaignName={bundle?.campaignName}
              isEmpty={bundle?.files.length === 0}
              onOpenCollection={() => setIsCollectionOpen(true)}
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
            <div className="flex flex-col items-center gap-8">
              {(detectedName || bundle.displayName) && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-6 py-3 flex items-center gap-3"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-sm font-bold text-emerald-700">
                    おかえりなさい、{detectedName || bundle.displayName} さん
                  </p>
                </motion.div>
              )}
              
              {/* コレクション・ドロワー */}
              <CollectionDrawer 
                currentToken={token} 
                isOpen={isCollectionOpen} 
                onClose={() => setIsCollectionOpen(false)} 
              />

              <>
                <ClaimContentView 
                  files={bundle.files} 
                  expiryDate={new Date(bundle.expiryIso)} 
                  campaignName={bundle.campaignName}
                  claimToken={token}
                  hideActionBar={isCollectionOpen}
                  onOpenCollection={() => setIsCollectionOpen(true)}
                />
                
                {/* パスケー未登録の場合のオプション案内 */}
                {!isPreview && !bundle.passkeyLinked && bundle.campaignId && (
                  <PasskeyRegisterCard 
                    campaignId={bundle.campaignId} 
                    onSuccess={() => window.location.reload()}
                  />
                )}
              </>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
