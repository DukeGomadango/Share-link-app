"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Gift } from "lucide-react";
import { ClaimUnopenedView } from "@/components/features/claim/ClaimUnopenedView";
import { ClaimContentView } from "@/components/features/claim/ClaimContentView";
import type { ClaimFile } from "@/components/features/claim/types";

const POLL_MS = 4000;

export default function ClaimSessionPage() {
  const [bundle, setBundle] = useState<{
    expiryIso: string;
    pending?: boolean;
    files: ClaimFile[];
  } | null>(null);
  const [noSession, setNoSession] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isOpened, setIsOpened] = useState(false);
  const prevPendingRef = useRef<boolean | undefined>(undefined);

  const fetchSession = useCallback(async () => {
    try {
      const r = await fetch("/api/claim/session", { credentials: "include" });
      if (r.status === 401) {
        setNoSession(true);
        setBundle(null);
        return;
      }
      if (!r.ok) {
        setLoadError("読み込みに失敗しました");
        return;
      }
      const data = (await r.json()) as {
        expiryIso: string;
        pending?: boolean;
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
      setBundle({
        expiryIso: data.expiryIso,
        pending: data.pending,
        files,
      });
      setNoSession(false);
      setLoadError(null);
    } catch {
      setLoadError("読み込みに失敗しました");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- マウント時にセッション取得（非同期）
    void fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    const p = bundle?.pending;
    if (
      prevPendingRef.current === true &&
      p === false &&
      bundle &&
      bundle.files.length > 0
    ) {
      setIsOpened(false);
    }
    prevPendingRef.current = p;
  }, [bundle]);

  useEffect(() => {
    if (!bundle?.pending) return;
    const t = setInterval(() => void fetchSession(), POLL_MS);
    return () => clearInterval(t);
  }, [bundle?.pending, fetchSession]);

  const expiryDate = bundle
    ? new Date(bundle.expiryIso)
    : (() => {
        const d = new Date();
        d.setDate(d.getDate() + 3);
        return d;
      })();

  if (noSession) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-8 text-center space-y-4">
        <p className="text-muted-foreground text-sm max-w-md">
          受け取りセッションがありません。ライバーから共有された受付ページでチェックインしてください。
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-8">
        <p className="text-destructive text-sm">{loadError}</p>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-8">
        <p className="text-muted-foreground text-sm">読み込み中…</p>
      </div>
    );
  }

  if (bundle.pending) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-8 text-center space-y-8">
        <motion.div
          className="relative w-44 h-44 bg-gradient-to-br from-emerald-400/80 to-emerald-600 rounded-3xl flex items-center justify-center shadow-xl"
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Gift className="w-20 h-20 text-white" strokeWidth={1.5} />
        </motion.div>
        <div className="space-y-2">
          <p className="text-lg font-semibold text-emerald-600">ライバーの準備中…</p>
          <p className="text-sm text-muted-foreground animate-pulse">
            ファイルが届くまでこのページを開いたままお待ちください
          </p>
        </div>
      </div>
    );
  }

  if (!isOpened && bundle.files.length > 0) {
    return (
      <ClaimUnopenedView
        onOpen={() => setIsOpened(true)}
        expiryDate={expiryDate}
      />
    );
  }

  if (bundle.files.length > 0) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-6">
        <ClaimContentView
          files={bundle.files}
          expiryDate={new Date(bundle.expiryIso)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-8">
      <p className="text-muted-foreground text-sm">準備中です…</p>
    </div>
  );
}
