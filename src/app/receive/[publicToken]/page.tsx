"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import type { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/browser";
import { Button } from "@/components/ui/button";

export default function PublicReceivePage() {
  const params = useParams<{ publicToken: string }>();
  const token =
    typeof params?.publicToken === "string" ? params.publicToken : "";
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [passkeyHint, setPasskeyHint] = useState<string | null>(null);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);

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
      setPasskeyHint("端末の本人確認が完了しました。上のフォームからチェックインを続行できます。");
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

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-6 bg-gradient-to-b from-background to-muted/30">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border border-border/60 bg-card/80 backdrop-blur-xl p-8 shadow-xl space-y-6"
      >
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight">受付チェックイン</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            表示名と、同名と区別するためのメモ（任意）を入力してください。送信後、この端末で受け取りページが開きます。
          </p>
        </div>
        <form onSubmit={(e) => void submit(e)} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="recv-name" className="text-sm font-medium">
              表示名 <span className="text-destructive">*</span>
            </label>
            <input
              id="recv-name"
              className="w-full rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              maxLength={200}
              autoComplete="nickname"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="配布で使う名前"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="recv-note" className="text-sm font-medium">
              識別メモ（任意）
            </label>
            <input
              id="recv-note"
              className="w-full rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              maxLength={300}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="@ · 通称 など"
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive border border-destructive/30 rounded-xl px-3 py-2 bg-destructive/5">
              {error}
            </p>
          ) : null}
          <Button
            type="submit"
            disabled={busy || !displayName.trim()}
            className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {busy ? "送信中…" : "チェックインして待機へ"}
          </Button>
        </form>
        <div className="border-t border-border/50 pt-5 space-y-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            前回と同じ端末で受け取り登録をした方は、先に端末の本人確認（任意）ができます。
          </p>
          {passkeyError ? (
            <p className="text-xs text-destructive border border-destructive/30 rounded-xl px-3 py-2 bg-destructive/5">
              {passkeyError}
            </p>
          ) : null}
          {passkeyHint ? (
            <p className="text-xs text-emerald-600 border border-emerald-500/20 rounded-xl px-3 py-2 bg-emerald-500/5">
              {passkeyHint}
            </p>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-2xl"
            disabled={passkeyBusy}
            onClick={() => void passkeyLogin()}
          >
            {passkeyBusy ? "認証中…" : "端末の本人確認（パスキー）"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
