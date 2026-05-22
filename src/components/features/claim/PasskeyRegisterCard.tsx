"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  startRegistration,
  startAuthentication,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/browser";
import { KeyRound, Loader2, CheckCircle2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  campaignId: string;
  currentName?: string;
  onSuccess?: () => void;
};

export function PasskeyRegisterCard({ campaignId, currentName, onSuccess }: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [newName, setNewName] = useState("");
  
  const isGuest = currentName === "ゲスト";

  const handle = async () => {
    setBusy(true);
    setErr(null);
    try {
      // --- ステップ1: 既存のパスキーがあるか確認（ログイン試行） ---
      const loginOptRes = await fetch("/api/webauthn/login/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const loginOptJson = (await loginOptRes.json()) as {
        options?: PublicKeyCredentialRequestOptionsJSON;
        challengeId?: string;
      };

      if (loginOptRes.ok && loginOptJson.options && loginOptJson.challengeId) {
        try {
          // ブラウザに既存の鍵を探させる
          const assertion = await startAuthentication({ optionsJSON: loginOptJson.options });
          
          // 既存の鍵が見つかった場合はログイン検証へ
          const verRes = await fetch("/api/webauthn/login/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              challengeId: loginOptJson.challengeId,
              credential: assertion,
            }),
          });

          if (verRes.ok) {
            // ログイン成功 ＝ 既存アカウントとの紐付け完了
            setDone(true);
            onSuccess?.();
            return;
          }
        } catch (authErr: unknown) {
          // 鍵が見つからない（NotFoundError）以外はエラーとして中断
          if (authErr instanceof Error && authErr.name !== "NotFoundError" && authErr.name !== "NotAllowedError") {
            throw authErr;
          }
          // NotFoundError（鍵がない）の場合は、そのままステップ2の新規登録へ進む
        }
      }

      // --- ステップ2: 新規パスキー作成（登録フロー） ---
      const optRes = await fetch("/api/webauthn/register/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ campaignId }),
      });
      // (以下、既存の登録ロジック)
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
          displayName: isGuest ? newName.trim() : undefined,
        }),
      });
      if (!verRes.ok) {
        const verJson = (await verRes.json().catch(() => ({}))) as { error?: string };
        setErr(verJson.error ?? "登録に失敗しました");
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
        setErr("本人確認が中断されました。");
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
          本人確認を保存しました。次回からは指紋や顔認証だけでアクセスできます。
        </p>
      </motion.div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-black/[0.05] bg-white/50 backdrop-blur-sm p-6 space-y-4 max-w-md w-full shadow-sm">
      <div className="space-y-2 text-center">
        <p className="text-sm font-bold text-foreground">
          このギフトを保存しますか？
        </p>
        <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
          生体認証を登録すると、URLを忘れても指紋や顔認証で再アクセスできるようになります（任意）。
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
        ) : (
          <KeyRound className="w-5 h-5" aria-hidden />
        )}
        {isGuest ? "名前を決めて保存する" : "生体認証で保存する"}
      </Button>
    </div>
  );
}
