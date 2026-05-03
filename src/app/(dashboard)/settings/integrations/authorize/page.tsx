"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
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
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/settings/integrations">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.integrations.authorizeTitle}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t.integrations.authorizeSubtitle}</p>
        </div>
      </div>

      <GlassCard className="space-y-4">
        {!valid ? (
          <p className="text-sm text-destructive">{t.integrations.missingParams}</p>
        ) : (
          <>
            <p className="font-medium">{t.integrations.consentLead}</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>{t.integrations.consentRead}</li>
              <li>{t.integrations.consentIssue}</li>
            </ul>

            <button
              type="button"
              className="text-xs text-emerald-600 hover:underline"
              onClick={() => setShowScopes((s) => !s)}
            >
              {t.integrations.scopesDetail}
            </button>
            {showScopes ? (
              <pre className="text-xs bg-muted/50 p-2 rounded-md overflow-x-auto">
                campaigns:read, claims:issue
              </pre>
            ) : null}

            <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border/40">
              <p>
                <span className="font-medium">{t.integrations.clientIdLabel}: </span>
                {clientId}
              </p>
              <p className="break-all">
                <span className="font-medium">{t.integrations.redirectLabel}: </span>
                {redirectUri}
              </p>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                type="button"
                onClick={() => void approve()}
                disabled={loading}
                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full"
              >
                {loading ? t.common.loading : t.integrations.approve}
              </Button>
              <Button variant="outline" asChild className="rounded-full">
                <Link href="/settings/integrations">{t.integrations.deny}</Link>
              </Button>
            </div>
          </>
        )}
      </GlassCard>
    </div>
  );
}

export default function IntegrationsAuthorizePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto py-12 text-center text-muted-foreground">
          読み込み中…
        </div>
      }
    >
      <AuthorizeInner />
    </Suspense>
  );
}
