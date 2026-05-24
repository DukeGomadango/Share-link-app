"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { isOAuthTokenForClient } from "@/lib/integration-oauth-token-label";
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
      toast.success(t.integrations.issueSuccess);
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
        : t.integrations.revokeSuccess
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
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="shrink-0 rounded-full">
          <Link href="/settings">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t.integrations.title}</h1>
          <p className="mt-1 text-muted-foreground">{t.integrations.subtitle}</p>
        </div>
      </div>

      <SettingsSection
        heading={t.integrations.listHeading}
        description={t.integrations.redirectNote}
      >
      <GlassCard className="space-y-4">
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
            size="touch"
            className="min-h-11 w-full bg-emerald-500 text-white hover:bg-emerald-600 sm:w-auto sm:rounded-full"
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
                <Button
                  variant="outline"
                  size="touch"
                  className="min-h-11 w-full sm:h-8 sm:min-h-8 sm:w-auto sm:px-3 sm:text-sm"
                  onClick={() => startRevoke(tok.id)}
                >
                  {t.integrations.revoke}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
      </SettingsSection>

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
