"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { isOAuthTokenForClient } from "@/lib/integration-token-lifecycle";
import { toast } from "sonner";

type TokenRow = {
  id: string;
  label: string;
  scopes: string;
  createdAt: string;
  lastUsedAt: string | null;
};

export default function IntegrationsSettingsPage() {
  const { t } = useTranslation();
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [label, setLabel] = useState("");
  const [onceToken, setOnceToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingRevokeId, setPendingRevokeId] = useState<string | null>(null);
  const [pruneConfirmOpen, setPruneConfirmOpen] = useState(false);
  const [pruneBusy, setPruneBusy] = useState(false);

  const oauthGachaCount = tokens.filter((t) =>
    isOAuthTokenForClient(t.label, "dango-tools-gacha")
  ).length;

  const pendingRevokeToken = pendingRevokeId
    ? tokens.find((tok) => tok.id === pendingRevokeId)
    : undefined;
  const pendingRevokeIsDangoOAuth =
    !!pendingRevokeToken &&
    isOAuthTokenForClient(pendingRevokeToken.label, "dango-tools-gacha");

  const refresh = useCallback(async () => {
    const res = await fetch("/api/integrations/tokens");
    if (!res.ok) return;
    const data = (await res.json()) as { tokens: TokenRow[] };
    setTokens(data.tokens);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- マウント時 GET（refresh は async）
    void refresh();
  }, [refresh]);

  async function issue() {
    setLoading(true);
    setOnceToken(null);
    try {
      const res = await fetch("/api/integrations/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim() || undefined }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { token: string };
      setOnceToken(data.token);
      setLabel("");
      await refresh();
      toast.success("APIトークンを発行しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(id: string) {
    const row = tokens.find((tok) => tok.id === id);
    const isDangoOAuth =
      !!row && isOAuthTokenForClient(row.label, "dango-tools-gacha");
    await fetch(`/api/integrations/tokens/${id}`, { method: "DELETE" });
    await refresh();
    toast.success(
      isDangoOAuth
        ? t.integrations.revokeSuccessDangoOAuth
        : "APIトークンを失効させました"
    );
  }

  function startRevoke(id: string) {
    setPendingRevokeId(id);
    setConfirmOpen(true);
  }

  async function handlePruneOAuth() {
    setPruneBusy(true);
    try {
      const res = await fetch("/api/integrations/tokens/prune-oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: "dango-tools-gacha",
          keep: "latest_used",
        }),
      });
      const data = (await res.json()) as { removed?: number; error?: string };
      if (!res.ok) {
        toast.error(data.error ?? t.integrations.pruneFailed);
        return;
      }
      await refresh();
      toast.success(
        t.integrations.pruneSuccess.replace("{count}", String(data.removed ?? 0))
      );
    } finally {
      setPruneBusy(false);
      setPruneConfirmOpen(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full shrink-0">
          <Link href="/settings">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.integrations.title}</h1>
          <p className="text-muted-foreground mt-1">{t.integrations.subtitle}</p>
        </div>
      </div>

      <GlassCard className="space-y-4">
        <h2 className="font-semibold text-lg">{t.integrations.listHeading}</h2>
        <p className="text-sm text-muted-foreground">{t.integrations.redirectNote}</p>
        <p className="text-sm text-muted-foreground">{t.integrations.oauthRotationNote}</p>

        {oauthGachaCount >= 2 ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-amber-900 dark:text-amber-100">
              {t.integrations.duplicateOAuthHint.replace("{count}", String(oauthGachaCount))}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pruneBusy}
              onClick={() => setPruneConfirmOpen(true)}
            >
              {pruneBusy ? t.common.loading : t.integrations.pruneOAuth}
            </Button>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[200px] space-y-1">
            <label className="text-xs text-muted-foreground">{t.integrations.labelPlaceholder}</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-border/80 bg-background/50 text-sm"
              placeholder={t.integrations.labelPlaceholder}
            />
          </div>
          <Button
            type="button"
            onClick={() => void issue()}
            disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full"
          >
            {loading ? t.common.loading : t.integrations.issueToken}
          </Button>
        </div>

        {onceToken ? (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 space-y-2">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              {t.integrations.issuedOnce}
            </p>
            <code className="block text-xs break-all p-2 rounded bg-background/80">{onceToken}</code>
          </div>
        ) : null}

        {tokens.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">{t.integrations.empty}</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {tokens.map((tok) => (
              <li key={tok.id} className="py-3 flex flex-wrap justify-between gap-2 items-start">
                <div>
                  <p className="font-medium">{tok.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.integrations.scopesLine.replace("{scopes}", tok.scopes)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.integrations.createdAtLine.replace("{date}", tok.createdAt)}
                  </p>
                  {tok.lastUsedAt ? (
                    <p className="text-xs text-muted-foreground">
                      {t.integrations.lastUsedLine.replace("{date}", tok.lastUsedAt)}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground/70">
                      {t.integrations.lastUsedNever}
                    </p>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => startRevoke(tok.id)}>
                  {t.integrations.revoke}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          if (pendingRevokeId) void handleRevoke(pendingRevokeId);
        }}
        title={t.integrations.revokeConfirmTitle}
        description={
          pendingRevokeIsDangoOAuth
            ? t.integrations.revokeConfirmDescriptionDangoOAuth
            : t.integrations.revokeConfirmDescription
        }
        confirmText={t.integrations.revokeConfirmAction}
        variant="destructive"
      />

      <ConfirmModal
        isOpen={pruneConfirmOpen}
        onClose={() => setPruneConfirmOpen(false)}
        onConfirm={() => void handlePruneOAuth()}
        title={t.integrations.pruneConfirmTitle}
        description={t.integrations.pruneConfirmDescription}
        confirmText={t.integrations.pruneConfirmAction}
        variant="destructive"
      />
    </div>
  );
}
