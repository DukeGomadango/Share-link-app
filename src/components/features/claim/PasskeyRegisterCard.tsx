"use client";

import { useState } from "react";
import {
  startRegistration,
  type PublicKeyCredentialCreationOptionsJSON,
} from "@simplewebauthn/browser";
import { KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  campaignId: string;
  onSuccess?: () => void;
};

export function PasskeyRegisterCard({ campaignId, onSuccess }: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handle = async () => {
    setBusy(true);
    setErr(null);
    try {
      const optRes = await fetch("/api/webauthn/register/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ campaignId }),
      });
      const optJson = (await optRes.json()) as {
        error?: string;
        message?: string;
        options?: PublicKeyCredentialCreationOptionsJSON;
        challengeId?: string;
      };
      if (!optRes.ok) {
        if (optRes.status === 409) {
          setDone(true);
          onSuccess?.();
          return;
        }
        setErr(optJson.message ?? optJson.error ?? "準備に失敗しました");
        return;
      }
      if (!optJson.options || !optJson.challengeId) {
        setErr("サーバー応答が不正です");
        return;
      }
      const att = await startRegistration({ optionsJSON: optJson.options });
      const verRes = await fetch("/api/webauthn/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          campaignId,
          challengeId: optJson.challengeId,
          credential: att,
        }),
      });
      const verJson = (await verRes.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      if (!verRes.ok) {
        setErr(verJson.message ?? verJson.error ?? "登録に失敗しました");
        return;
      }
      setDone(true);
      onSuccess?.();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <p className="text-xs text-emerald-600/90 text-center max-w-md">
        この端末で本人確認の登録が済みました。次回以降はパスキーで続けられます。
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 space-y-3 max-w-md w-full">
      <p className="text-sm text-muted-foreground leading-relaxed">
        このスマホに保存すると、次回から同じブラウザで名前入力の手間を減らせます（任意）。
      </p>
      {err ? <p className="text-xs text-destructive">{err}</p> : null}
      <Button
        type="button"
        variant="secondary"
        className="w-full gap-2 rounded-xl"
        onClick={() => void handle()}
        disabled={busy}
      >
        {busy ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
        ) : (
          <KeyRound className="w-4 h-4" aria-hidden />
        )}
        この端末で受け取りを覚えておく
      </Button>
    </div>
  );
}
