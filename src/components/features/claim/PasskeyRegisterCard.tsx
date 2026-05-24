"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  startRegistration,
  startAuthentication,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/browser";
import { Fingerprint, KeyRound, Loader2, CheckCircle2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Flow = "unlock" | "optional";

type Props = {
  campaignId: string;
  currentName?: string;
  /** unlock: 限定配布の初回（登録のみ）。optional: 開封後の任意登録 */
  flow?: Flow;
  onSuccess?: () => void;
};

async function tryPasskeyLogin(): Promise<boolean> {
  const loginOptRes = await fetch("/api/webauthn/login/options", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  const loginOptJson = (await loginOptRes.json()) as {
    options?: PublicKeyCredentialRequestOptionsJSON;
    challengeId?: string;
  };

  if (!loginOptRes.ok || !loginOptJson.options || !loginOptJson.challengeId) {
    return false;
  }

  try {
    const assertion = await startAuthentication({ optionsJSON: loginOptJson.options });
    const verRes = await fetch("/api/webauthn/login/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        challengeId: loginOptJson.challengeId,
        credential: assertion,
      }),
    });
    return verRes.ok;
  } catch (authErr: unknown) {
    if (
      authErr instanceof Error &&
      (authErr.name === "NotFoundError" || authErr.name === "NotAllowedError")
    ) {
      return false;
    }
    throw authErr;
  }
}

async function registerPasskey(
  campaignId: string,
  displayName?: string
): Promise<{ ok: true } | { ok: false; err: string }> {
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
      return { ok: true };
    }
    return {
      ok: false,
      err: optJson.message ?? optJson.error ?? "準備に失敗しました",
    };
  }

  if (!optJson.options || !optJson.challengeId) {
    return { ok: false, err: "サーバー応答が不正です" };
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
      displayName,
    }),
  });

  if (!verRes.ok) {
    const verJson = (await verRes.json().catch(() => ({}))) as { error?: string };
    return { ok: false, err: verJson.error ?? "登録に失敗しました" };
  }

  return { ok: true };
}

export function PasskeyRegisterCard({
  campaignId,
  currentName,
  flow = "optional",
  onSuccess,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [newName, setNewName] = useState("");

  const isGuest = currentName === "ゲスト";
  const isUnlock = flow === "unlock";

  const handle = async () => {
    setBusy(true);
    setErr(null);
    try {
      if (!isUnlock) {
        const loggedIn = await tryPasskeyLogin();
        if (loggedIn) {
          setDone(true);
          onSuccess?.();
          return;
        }
      }

      const reg = await registerPasskey(
        campaignId,
        isGuest ? newName.trim() : undefined
      );
      if (!reg.ok) {
        setErr(reg.err);
        return;
      }
      setDone(true);
      onSuccess?.();
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "NotAllowedError") {
        setErr(null);
      } else if (e instanceof Error && e.name === "TimeoutError") {
        setErr("タイムアウトしました。もう一度お試しください。");
      } else {
        console.error("Passkey process failed:", e);
        setErr(isUnlock ? "開封が中断されました。" : "本人確認が中断されました。");
      }
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-emerald-50 border border-emerald-100"
      >
        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        <p className="text-xs font-bold text-emerald-700 text-center">
          {isUnlock
            ? "この端末に保存しました。ギフトを開けます。"
            : "本人確認を保存しました。次回からは指紋や顔認証だけでアクセスできます。"}
        </p>
      </motion.div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-black/[0.05] bg-white/50 backdrop-blur-sm p-6 space-y-4 max-w-md w-full shadow-sm">
      <div className="space-y-2 text-center">
        <p className="text-sm font-bold text-foreground">
          {isUnlock ? "この端末で開く" : "このギフトを保存しますか？"}
        </p>
        <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
          {isUnlock ? (
            <>
              Face ID または Touch ID で、この iPhone にパスキーを作成します。
              <span className="block mt-1 text-amber-700/90">
                初めての方: QRコードやセキュリティキーは選ばず、画面の案内に従ってください。
              </span>
            </>
          ) : (
            "生体認証を登録すると、URLを忘れても指紋や顔認証で再アクセスできるようになります（任意）。"
          )}
        </p>
      </div>

      {isGuest && (
        <div className="space-y-2 pt-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600 px-1 flex items-center gap-2">
            <User className="w-3 h-3" />
            名簿に登録するお名前
          </label>
          <Input
            placeholder="ニックネームを入力"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="h-11 rounded-xl bg-white border-emerald-100 focus-visible:ring-emerald-500/20"
          />
        </div>
      )}

      {err ? (
        <p className="text-[10px] text-destructive text-center font-bold bg-destructive/5 py-2 rounded-lg border border-destructive/10">
          {err}
        </p>
      ) : null}

      <Button
        type="button"
        variant="secondary"
        className="w-full h-12 gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold border-none transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-emerald-500/10"
        onClick={() => void handle()}
        disabled={busy || (isGuest && !newName.trim())}
      >
        {busy ? (
          <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
        ) : isUnlock ? (
          <Fingerprint className="w-5 h-5" aria-hidden />
        ) : (
          <KeyRound className="w-5 h-5" aria-hidden />
        )}
        {busy
          ? "処理中..."
          : isUnlock
            ? isGuest
              ? "名前を決めて開く"
              : "この端末で開く"
            : isGuest
              ? "名前を決めて保存する"
              : "生体認証で保存する"}
      </Button>
    </div>
  );
}
