"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/browser";
import { Button } from "@/components/ui/button";
import { Sparkles, Fingerprint, User, MessageSquare, ChevronRight } from "lucide-react";

export default function PublicReceivePage() {
  const params = useParams<{ publicToken: string }>();
  const token =
    typeof params?.publicToken === "string" ? params.publicToken : "";
  const router = useRouter();

  const [bootReady, setBootReady] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [passkeyHint, setPasskeyHint] = useState<string | null>(null);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);

  const tryResumeWithCookie = useCallback(async (): Promise<boolean> => {
    if (!token) return false;
    try {
      const r = await fetch(
        `/api/public/campaigns/${encodeURIComponent(token)}/check-in`,
        { method: "GET" }
      );
      if (!r.ok) return false;
      const j = (await r.json()) as { ok: boolean; campaignId?: string };
      if (j.ok && j.campaignId) {
        router.replace(`/claim/session/${encodeURIComponent(j.campaignId)}`);
        return true;
      }
    } catch (e) {
      console.error("Resume check failed:", e);
    }
    return false;
  }, [token, router]);

  const tryResumeAfterAuth = useCallback(async (): Promise<boolean> => {
    if (!token) return false;
    const r = await fetch(
      `/api/public/campaigns/${encodeURIComponent(token)}/resume-with-passkey`,
      { method: "POST", credentials: "include" }
    );
    if (!r.ok) return false;
    const j = (await r.json()) as { campaignId?: string };
    if (j.campaignId && typeof j.campaignId === "string") {
      router.replace(`/claim/session/${encodeURIComponent(j.campaignId)}`);
      return true;
    }
    return false;
  }, [token, router]);

  useEffect(() => {
    if (!token) {
      setBootReady(true);
      return;
    }
    let cancelled = false;
    void (async () => {
      // 1. クッキーによる静かな再開を試みる
      const cookieResumed = await tryResumeWithCookie();
      if (cancelled || cookieResumed) return;

      // 2. パスキーセッションによる再開を試みる（もしあれば）
      const passkeyResumed = await tryResumeAfterAuth();
      if (cancelled || passkeyResumed) return;

      setBootReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [token, tryResumeWithCookie, tryResumeAfterAuth]);

  const passkeyLogin = async () => {
    setPasskeyBusy(true);
    setPasskeyError(null);
    setPasskeyHint(null);
    try {
      const { startAuthentication, browserSupportsWebAuthn } = await import(
        "@simplewebauthn/browser"
      );
      if (!browserSupportsWebAuthn()) {
        setPasskeyError("このブラウザではパスキーに未対応です");
        return;
      }
      const optRes = await fetch("/api/webauthn/login/options", { method: "POST" });
      const optJson = (await optRes.json()) as {
        error?: string;
        options?: PublicKeyCredentialRequestOptionsJSON;
        challengeId?: string;
      };
      if (!optRes.ok || !optJson.options || !optJson.challengeId) {
        setPasskeyError(optJson.error ?? "認証の準備に失敗しました");
        return;
      }
      const assertion = await startAuthentication({ optionsJSON: optJson.options });
      const verRes = await fetch("/api/webauthn/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          challengeId: optJson.challengeId,
          credential: assertion,
        }),
      });
      if (!verRes.ok) {
        const v = (await verRes.json().catch(() => ({}))) as { error?: string };
        setPasskeyError(v.error ?? "認証に失敗しました");
        return;
      }
      const navigated = await tryResumeAfterAuth();
      if (!navigated) {
        setPasskeyHint(
          "このキャンペーンで再開できる受け取りがまだありません。初回は上のフォームからチェックインしてください。"
        );
      }
    } catch (e) {
      setPasskeyError(e instanceof Error ? e.message : "通信に失敗しました");
    } finally {
      setPasskeyBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = displayName.trim();
    if (!name || !token) {
      setError("名前を入力してください");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/public/campaigns/${encodeURIComponent(token)}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: name,
          note: note.trim() || null,
        }),
      });
      const j = (await r.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
        campaignId?: string;
      };
      if (!r.ok) {
        setError(j.message ?? j.error ?? "チェックインに失敗しました");
        return;
      }
      if (j.campaignId && typeof j.campaignId === "string") {
        router.push(`/claim/session/${encodeURIComponent(j.campaignId)}`);
      } else {
        router.push("/claim");
      }
    } catch {
      setError("通信に失敗しました");
    } finally {
      setBusy(false);
    }
  };

  if (!bootReady) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-6 bg-gradient-to-b from-background to-muted/30">
        <p className="text-sm animate-pulse text-muted-foreground">認証情報を確認中…</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-6 relative overflow-hidden bg-[#fafafa]">
      {/* Premium Texture Overlay */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      {/* Decorative Gradients */}
      <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-sky-500/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 120 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="rounded-[2.5rem] border border-white bg-white/70 backdrop-blur-3xl p-8 md:p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] space-y-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              Welcome to Gift Station
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">受付チェックイン</h1>
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              ライバーがあなたを待っています。<br />
              受け取りに使う名前を教えてください。
            </p>
          </div>

          <form onSubmit={(e) => void submit(e)} className="space-y-6">
            <div className="space-y-4">
              <div className="group space-y-2">
                <label htmlFor="recv-name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-2">
                  <User className="w-3 h-3" />
                  表示名 (必須)
                </label>
                <div className="relative">
                  <input
                    id="recv-name"
                    className="w-full rounded-2xl border border-black/[0.05] bg-white/50 px-5 py-4 text-sm font-bold outline-none ring-offset-background transition-all placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40"
                    maxLength={200}
                    autoComplete="nickname"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="ニックネームを入力"
                  />
                </div>
              </div>

              <div className="group space-y-2">
                <label htmlFor="recv-note" className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-2">
                  <MessageSquare className="w-3 h-3" />
                  識別メモ (任意)
                </label>
                <input
                  id="recv-note"
                  className="w-full rounded-2xl border border-black/[0.05] bg-white/50 px-5 py-4 text-sm font-bold outline-none ring-offset-background transition-all placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40"
                  maxLength={300}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="@TwitterID / 通称など"
                />
              </div>
            </div>

            {error ? (
              <motion.p 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-xs font-bold text-destructive border border-destructive/20 rounded-2xl px-4 py-3 bg-destructive/5 text-center"
              >
                {error}
              </motion.p>
            ) : null}

            <Button
              type="submit"
              disabled={busy || !displayName.trim()}
              className="w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-base font-black shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
            >
              {busy ? "送信中…" : "チェックインして待機へ"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-black/[0.05]" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
              <span className="bg-white/80 px-4 text-muted-foreground">or use your passkey</span>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              className="w-full h-14 rounded-2xl border-black/[0.05] bg-white/50 text-sm font-bold hover:bg-white hover:border-emerald-500/20 transition-all group"
              disabled={passkeyBusy}
              onClick={() => void passkeyLogin()}
            >
              <Fingerprint className="w-5 h-5 mr-3 text-emerald-500" />
              {passkeyBusy ? "認証中…" : "パスキーで続ける"}
              <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>

            {passkeyError ? (
              <p className="text-[10px] text-destructive text-center font-bold px-4">
                {passkeyError}
              </p>
            ) : null}
            {passkeyHint ? (
              <p className="text-[10px] text-emerald-600 text-center font-bold px-4 leading-relaxed">
                {passkeyHint}
              </p>
            ) : null}
          </div>
        </div>

        <p className="text-center mt-8 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">
          Powered by Gift Station 2026
        </p>
      </motion.div>
    </div>
  );
}
