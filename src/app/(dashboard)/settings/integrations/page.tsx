"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

type TokenRow = {
  id: string;
  label: string;
  scopes: string;
  createdAt: string;
};

export default function IntegrationsSettingsPage() {
  const { t } = useTranslation();
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [label, setLabel] = useState("");
  const [onceToken, setOnceToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    } finally {
      setLoading(false);
    }
  }

  async function revoke(id: string) {
    if (!confirm(t.integrations.revoke + "?")) return;
    await fetch(`/api/integrations/tokens/${id}`, { method: "DELETE" });
    await refresh();
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
                  <p className="text-xs text-muted-foreground">{tok.createdAt}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => void revoke(tok.id)}>
                  {t.integrations.revoke}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}
