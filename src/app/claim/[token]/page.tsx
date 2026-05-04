"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
  const token = typeof params?.token === "string" ? params.token : "";

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const [bundle, setBundle] = useState<{
    expiryIso: string;
    campaignName: string;
    files: ClaimFile[];
  } | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimLoading, setClaimLoading] = useState(false);

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
                type: f.type === "audio" ? "audio" : "image",
                src: f.src,
                filename: f.filename,
                title: f.title,
              }));
              setBundle({ expiryIso: data.expiryIso, campaignName: data.campaignName, files });
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
    if (!isOpened || !token) return;
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setClaimLoading(true);
      setClaimError(null);
      try {
        const r = await fetch(`/api/claim/${encodeURIComponent(token)}?t=${Date.now()}`, { cache: "no-store" });
        if (!r.ok) throw new Error(String(r.status));
        const data = (await r.json()) as {
          expiryIso: string;
          campaignName: string;
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
          type: f.type === "audio" ? "audio" : "image",
          src: f.src,
          filename: f.filename,
          title: f.title,
        }));
        if (!cancelled) {
          setBundle({ expiryIso: data.expiryIso, campaignName: data.campaignName, files });
        }
      } catch {
        if (!cancelled) setClaimError("読み込みに失敗しました");
      } finally {
        if (!cancelled) setClaimLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpened, token]);

  const handleAuth = () => {
    setTimeout(() => {
      setIsAuthenticated(true);
    }, 800);
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
          <ClaimAuthView onVerify={handleAuth} />
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
          <ClaimUnopenedView onOpen={() => setIsOpened(true)} expiryDate={expiryDate} />
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
            <p className="text-center text-destructive py-8 text-sm">{claimError}</p>
          )}
          {claimLoading && !claimError && (
            <p className="text-center text-muted-foreground py-8 text-sm">読み込み中…</p>
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
