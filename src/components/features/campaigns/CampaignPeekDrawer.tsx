"use client";

import { X, AlertTriangle, Clock3 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/GlassCard";
import type { Campaign } from "@/components/features/campaigns/types";
import { useTranslation } from "@/lib/i18n";

interface CampaignPeekDrawerProps {
  peekCampaign: Campaign | null;
  onClose: () => void;
  formatDate: (date: string) => string;
  isNeedsAttention: (campaign: Campaign) => boolean;
  isDueSoon: (campaign: Campaign) => boolean;
}

export function CampaignPeekDrawer({
  peekCampaign,
  onClose,
  formatDate,
  isNeedsAttention,
  isDueSoon,
}: CampaignPeekDrawerProps) {
  const { t } = useTranslation();

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${peekCampaign ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
      />
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-border bg-background/95 p-6 backdrop-blur transition-transform duration-300 ${peekCampaign ? "translate-x-0" : "translate-x-full"}`}
      >
        {peekCampaign && (
          <div className="flex h-full flex-col">
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t.campaigns.peek.title}
                </p>
                <h2 className="text-xl font-semibold">{peekCampaign.name}</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <GlassCard className="p-4">
                <p className="text-xs text-muted-foreground mb-2">{t.campaigns.peek.createdAt}</p>
                <p className="font-medium">{formatDate(peekCampaign.createdAt)}</p>
              </GlassCard>
              <GlassCard className="p-4">
                <p className="text-xs text-muted-foreground mb-2">{t.campaigns.peek.type}</p>
                <p className="font-medium uppercase">{peekCampaign.type}</p>
              </GlassCard>
              <GlassCard className="p-4">
                <p className="text-xs text-muted-foreground mb-2">{t.campaigns.peek.recipients}</p>
                <p className="font-medium">{peekCampaign.stats.assignedRecipients}</p>
              </GlassCard>
              {peekCampaign.expiresAt && (
                <GlassCard className="p-4">
                  <p className="text-xs text-muted-foreground mb-2">{t.campaigns.new.expiryLabel}</p>
                  <p className="font-medium">{formatDate(peekCampaign.expiresAt)}</p>
                </GlassCard>
              )}

              {peekCampaign.description && (
                <GlassCard className="p-4">
                  <p className="text-xs text-muted-foreground mb-2">{t.campaigns.new.descriptionLabel}</p>
                  <p className="text-sm leading-relaxed">{peekCampaign.description}</p>
                </GlassCard>
              )}

              {peekCampaign.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {peekCampaign.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-emerald-500/10 text-emerald-600 rounded-md text-[10px] font-semibold border border-emerald-500/20"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              {isNeedsAttention(peekCampaign) && (
                <GlassCard className="p-4 border-amber-500/40">
                  <div className="flex items-center gap-2 text-amber-300">
                    <AlertTriangle className="w-4 h-4" />
                    <p className="text-sm">{t.campaigns.quickFilters.needsAttention}</p>
                  </div>
                </GlassCard>
              )}
              {isDueSoon(peekCampaign) && (
                <GlassCard className="p-4 border-purple-500/40">
                  <div className="flex items-center gap-2 text-purple-300">
                    <Clock3 className="w-4 h-4" />
                    <p className="text-sm">{t.campaigns.quickFilters.dueSoon}</p>
                  </div>
                </GlassCard>
              )}
            </div>

            <div className="mt-auto pt-6 space-y-2">
              <Button asChild className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
                <Link href={`/campaigns/${peekCampaign.id}`}>{t.common.manage}</Link>
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={onClose}
              >
                {t.campaigns.peek.close}
              </Button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
