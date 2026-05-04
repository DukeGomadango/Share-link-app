"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Gift } from "lucide-react";
import { ClaimUnopenedView } from "@/components/features/claim/ClaimUnopenedView";
import { ClaimContentView } from "@/components/features/claim/ClaimContentView";
import { PasskeyRegisterCard } from "@/components/features/claim/PasskeyRegisterCard";
import type { ClaimFile } from "@/components/features/claim/types";
import { CLAIM_SESSION_MAX_AGE_SEC } from "@/lib/claims/constants";

const POLL_MS = 4000;
const SESSION_DAYS = Math.round(CLAIM_SESSION_MAX_AGE_SEC / (60 * 60 * 24));

export default function ClaimSessionByCampaignPage() {
  const params = useParams<{ campaignId: string }>();
  const campaignId =
    typeof params?.campaignId === "string" ? params.campaignId : "";

  const [bundle, setBundle] = useState<{
    expiryIso: string;
    campaignName: string;
    pending?: boolean;
    passkeyLinked?: boolean;
    files: ClaimFile[];
  } | null>(null);
  const [noSession, setNoSession] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const prevPendingRef = useRef<boolean | undefined>(undefined);
  const [isRefetching, setIsRefetching] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchSession = useCallback(async (options?: { force?: boolean }) => {
    if (!campaignId) return;
    if (options?.force) setIsRefetching(true);
    try {
      const r = await fetch(
        `/api/claim/session?campaignId=${encodeURIComponent(
          campaignId
        )}&t=${Date.now()}`,
        { credentials: "include", cache: "no-store" }
      );
      if (r.status === 401) {
        setNoSession(true);
        setBundle(null);
        return;
      }
      if (r.status === 400) {
        setLoadError("リクエストが不正です");
        return;
      }
      if (!r.ok) {
        setLoadError("読み込みに失敗しました");
        return;
      }
      const data = (await r.json()) as {
        expiryIso: string;
        campaignName: string;
        pending?: boolean;
        passkeyLinked?: boolean;
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
        campaignName: data.campaignName,
        pending: data.pending,
        passkeyLinked: data.passkeyLinked,
        files,
      });
      setNoSession(false);
      setLoadError(null);
    } catch {
      setLoadError("読み込みに失敗しました");
    } finally {
      if (options?.force) setIsRefetching(false);
    }
  }, [campaignId]);

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

  if (!campaignId) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-8">
        <p className="text-muted-foreground text-sm">キャンペーンが指定されていません。</p>
      </div>
    );
  }

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
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-8 text-center space-y-6">
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
        <p className="text-[11px] text-muted-foreground/80 max-w-sm leading-relaxed">
          このブラウザでは約 {SESSION_DAYS}{" "}
          日間、同じ受け取りページから続けられます（パスキー未登録の場合）。
        </p>
      </div>
    );
  }

  if (!isOpened && bundle.files.length > 0) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center">
        <ClaimUnopenedView
          onOpen={async () => {
            // 開封の瞬間に最新の署名付きURLを再取得して、確実に表示されるようにする
            await fetchSession({ force: true });
            setIsOpened(true);
          }}
          expiryDate={expiryDate}
          isLoading={isRefetching}
        />
        <p className="text-[11px] text-muted-foreground/80 max-w-sm text-center px-4 pb-8">
          このブラウザでは約 {SESSION_DAYS}{" "}
          日間、同じ受け取りページから続けられます。
        </p>
      </div>
    );
  }

  if (bundle.files.length > 0) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 gap-6">
        <ClaimContentView
          files={bundle.files}
          expiryDate={new Date(bundle.expiryIso)}
          campaignName={bundle.campaignName}
        />
        {!bundle.passkeyLinked ? (
          <PasskeyRegisterCard
            campaignId={campaignId}
            onSuccess={() => void fetchSession()}
          />
        ) : null}
        <p className="text-[11px] text-muted-foreground/70 max-w-sm text-center">
          このブラウザでは約 {SESSION_DAYS} 日間、同じ受け取りページから続けられます。
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-8">
      <p className="text-muted-foreground text-sm">準備中です…</p>
    </div>
  );
}
