"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Gift, Sparkles, Eye, Link as LinkIcon, ChevronDown, ChevronUp, Info, ShieldCheck, AlertTriangle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

function AuthorizeInner() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const clientId = searchParams.get("client_id") ?? "";
  const redirectUri = searchParams.get("redirect_uri") ?? "";
  const state = searchParams.get("state") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showScopes, setShowScopes] = useState(false);
  const [showDevInfo, setShowDevInfo] = useState(false);

  const valid = Boolean(clientId && redirectUri);

  async function approve() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/integrations/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          redirect_uri: redirectUri,
          state: state || undefined,
          label: `OAuth: ${clientId}`,
        }),
      });
      const data = (await res.json()) as { redirectUrl?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "consent_failed");
      }
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-background relative overflow-hidden">
      {/* 揺らめく背景のグラデーションオーブ (だんごシェア×だんごツールの色調) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none animate-pulse duration-[8s]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 dark:bg-purple-500/5 blur-[120px] rounded-full pointer-events-none animate-pulse duration-[10s]" />

      <style>{`
        @keyframes slideParticle {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>

      <div className="w-full max-w-lg relative z-10 flex flex-col items-center">
        {/* 戻るボタンとヘッダータイトル */}
        <div className="w-full flex items-center justify-between mb-8 px-2">
          <Button variant="ghost" size="icon" asChild className="rounded-full bg-white/5 dark:bg-black/10 backdrop-blur-sm border border-white/10 hover:bg-white/15">
            <Link href="/settings/integrations">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">{t.integrations.authorizeTitle}</span>
          <div className="w-10 h-10 opacity-0 pointer-events-none" /> {/* 配置バランス用 */}
        </div>

        {/* コネクション・パイプライン・ビジュアル */}
        {valid && (
          <div className="flex items-center justify-center gap-6 mb-8 w-full animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-white/20 relative transform hover:scale-105 transition-transform duration-300">
                <Gift className="w-8 h-8 text-white animate-bounce duration-[3s]" />
              </div>
              <span className="text-[10px] font-bold tracking-wider text-emerald-600/80 dark:text-emerald-400/80 uppercase">だんごシェア</span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center py-4">
              <div className="relative w-24 h-1 bg-border/40 dark:bg-white/10 rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-purple-500 to-emerald-500 opacity-60" />
                <div 
                  className="absolute top-0 bottom-0 left-0 w-1/3 bg-white blur-[2px] opacity-80"
                  style={{
                    animation: "slideParticle 2s infinite linear",
                  }}
                />
              </div>
              <span className="text-[8px] font-mono font-bold text-muted-foreground/40 uppercase tracking-[0.25em] mt-2">CONNECTED</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20 border border-white/20 relative transform hover:scale-105 transition-transform duration-300">
                <Sparkles className="w-8 h-8 text-white animate-pulse" />
              </div>
              <span className="text-[10px] font-bold tracking-wider text-purple-600/80 dark:text-purple-400/80 uppercase truncate max-w-[80px]">
                {clientId === "dango_tool" ? "だんごツール" : clientId || "外部アプリ"}
              </span>
            </div>
          </div>
        )}

        {/* メインの承諾カード */}
        <GlassCard className="w-full relative shadow-2xl p-8 rounded-[2.5rem] border border-white/10 dark:border-white/5 space-y-6">
          {!valid ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto text-destructive">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <p className="text-sm text-destructive font-bold">{t.integrations.missingParams}</p>
            </div>
          ) : (
            <>
              {/* カードタイトル */}
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black tracking-tight">{t.integrations.authorizeTitle}</h2>
                <p className="text-muted-foreground/80 text-sm font-medium">{t.integrations.authorizeSubtitle}</p>
              </div>

              {/* 要求権限セクション (リストから美しいカード形式へ) */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest pl-1">
                  {t.integrations.consentLead}
                </p>
                
                {/* 権限1: 読み取り */}
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/50 dark:bg-black/20 border border-white/40 dark:border-white/5 backdrop-blur-sm shadow-sm transition-all hover:bg-white/70 dark:hover:bg-black/35">
                  <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500 shrink-0">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">{t.integrations.consentRead}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      キャンペーンのアセット一覧やファイルのプレビュー情報（画像・音声等）を参照します。
                    </p>
                  </div>
                </div>

                {/* 権限2: 発行 */}
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/50 dark:bg-black/20 border border-white/40 dark:border-white/5 backdrop-blur-sm shadow-sm transition-all hover:bg-white/70 dark:hover:bg-black/35">
                  <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500 shrink-0">
                    <LinkIcon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">{t.integrations.consentIssue}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      アセットごとに、リスナーに配布するための安全な受取用リンク（Claim）を新規に発行します。
                    </p>
                  </div>
                </div>
              </div>

              {/* 機械可読スコープ表示 */}
              <div className="space-y-2">
                <button
                  type="button"
                  className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-muted/40 border border-border/40 hover:bg-muted/60 transition-colors text-xs text-muted-foreground font-bold"
                  onClick={() => setShowScopes((s) => !s)}
                >
                  <span>{t.integrations.scopesDetail}</span>
                  {showScopes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showScopes && (
                  <pre className="text-xs font-mono bg-black/5 dark:bg-black/40 p-3 rounded-xl overflow-x-auto text-muted-foreground/80 border border-border/20 max-h-32 scrollbar-none animate-in fade-in duration-300">
                    campaigns:read, claims:issue
                  </pre>
                )}
              </div>

              {/* アクションエラー表示 */}
              {error && (
                <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium animate-in fade-in duration-300">
                  {error}
                </div>
              )}

              {/* アクションボタングループ */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => void approve()}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-full font-bold h-12 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      {t.integrations.approve}
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  asChild 
                  className="flex-1 rounded-full h-12 border-border/80 hover:bg-muted/30 hover:scale-[1.02] active:scale-[0.98] transition-all font-semibold"
                >
                  <Link href="/settings/integrations">{t.integrations.deny}</Link>
                </Button>
              </div>

              {/* 開発者用メタデータ (畳み込みアコーディオン) */}
              <div className="pt-4 border-t border-border/40 space-y-2">
                <button
                  type="button"
                  className="flex items-center justify-center gap-1 mx-auto text-[10px] uppercase font-black tracking-wider text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
                  onClick={() => setShowDevInfo((s) => !s)}
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>Developer Metadata</span>
                </button>
                {showDevInfo && (
                  <div className="p-4 rounded-2xl bg-black/5 dark:bg-black/20 border border-border/20 text-left space-y-2 font-mono text-[10px] text-muted-foreground leading-relaxed animate-in fade-in duration-300">
                    <p>
                      <span className="font-bold text-foreground/70">{t.integrations.clientIdLabel}: </span>
                      {clientId}
                    </p>
                    <p className="break-all">
                      <span className="font-bold text-foreground/70">{t.integrations.redirectLabel}: </span>
                      {redirectUri}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

export default function IntegrationsAuthorizePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AuthorizeInner />
    </Suspense>
  );
}
