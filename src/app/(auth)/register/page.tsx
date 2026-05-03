"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { Gift } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const [creatorName, setCreatorName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const configured =
    typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
    typeof process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY === "string" &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.length > 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) {
      setError("Supabase の環境変数が未設定です。.env.local を確認してください。");
      return;
    }
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: creatorName.trim(),
          },
        },
      });
      if (err) {
        throw err;
      }
      if (data.session) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setInfo(
          "確認メールを送信しました。メール内のリンクから登録を完了してください。"
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "登録に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

      <GlassCard className="w-full max-w-md relative z-10 p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-emerald-500/10 rounded-2xl mb-4">
            <Gift className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t.auth.register.title}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t.auth.register.subtitle}</p>
        </div>

        {!configured ? (
          <p className="text-sm text-amber-600 dark:text-amber-400 mb-4">
            NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY を設定してください。
          </p>
        ) : null}

        <form className="space-y-5" onSubmit={onSubmit}>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          {info ? (
            <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
              {info}
            </p>
          ) : null}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t.auth.register.creatorName}
            </label>
            <input
              type="text"
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-border/80 bg-background/50 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-shadow"
              placeholder={t.auth.register.creatorNamePlaceholder}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t.auth.register.email}</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-border/80 bg-background/50 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-shadow"
              placeholder="creater@example.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t.auth.register.password}
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-border/80 bg-background/50 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-shadow"
              placeholder="••••••••"
            />
          </div>
          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 rounded-full"
            >
              {loading ? t.common.loading : t.auth.register.signUp}
            </Button>
          </div>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-8">
          {t.auth.register.alreadyHaveAccount}{" "}
          <Link href="/login" className="text-emerald-500 hover:underline font-medium ml-1">
            {t.auth.register.signIn}
          </Link>
        </p>
      </GlassCard>
    </div>
  );
}
