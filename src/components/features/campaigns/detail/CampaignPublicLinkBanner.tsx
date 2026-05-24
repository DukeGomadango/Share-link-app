"use client";

import { Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CollapsibleCallout } from "@/components/shared/CollapsibleCallout";
import { useTranslation } from "@/lib/i18n";
import { toast } from "sonner";

type CampaignPublicLinkBannerProps = {
  publicToken: string;
  collapsible?: boolean;
};

export function CampaignPublicLinkBanner({
  publicToken,
  collapsible = true,
}: CampaignPublicLinkBannerProps) {
  const { t } = useTranslation();
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/receive/${publicToken}`
      : `/receive/${publicToken}`;

  const copy = () => {
    void navigator.clipboard.writeText(url);
    toast.success("共有リンクをコピーしました");
  };

  const body = (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        このリンクをSNSや概要欄に貼るだけで、誰でもファイルを受け取れます。
      </p>
      <div className="rounded-xl border border-emerald-500/20 bg-background/80 px-3 py-2 font-mono text-xs text-muted-foreground break-all">
        {url}
      </div>
      <Button
        type="button"
        size="touch"
        className="w-full bg-emerald-500 text-white hover:bg-emerald-600"
        onClick={copy}
      >
        コピー
      </Button>
    </div>
  );

  if (!collapsible) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent p-5">
        <h3 className="mb-2 flex items-center gap-2 text-base font-bold text-emerald-900 dark:text-emerald-100">
          <LinkIcon className="size-5 text-emerald-500" />
          {t.mobile.publicLinkTitle}
        </h3>
        {body}
      </div>
    );
  }

  return (
    <CollapsibleCallout
      title={t.mobile.publicLinkSummary}
      dismissStorageKey="dango-campaign-public-link-collapsed"
      tone="emerald"
    >
      {body}
    </CollapsibleCallout>
  );
}
