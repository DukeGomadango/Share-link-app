"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Megaphone } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function NewCampaignPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(typeof err.error === "string" ? err.error : "作成に失敗しました");
      }
      const campaign = (await res.json()) as { id: string };
      router.push(`/campaigns/${campaign.id}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "作成に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/campaigns">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.campaigns.new.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t.campaigns.new.subtitle}</p>
        </div>
      </div>

      <GlassCard>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t.campaigns.new.nameLabel}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.campaigns.searchPlaceholder}
              required
              className="w-full px-4 py-3 bg-background/50 border border-border/80 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-shadow"
            />
          </div>

          <div className="pt-6 flex justify-end space-x-4 border-t border-border/30">
            <Button variant="ghost" asChild className="rounded-full px-6">
              <Link href="/campaigns">{t.common.cancel}</Link>
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 px-8 rounded-full transition-transform hover:-translate-y-0.5"
            >
              <Megaphone className="w-4 h-4 mr-2" />
              {loading ? t.common.loading : t.campaigns.new.submit}
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
