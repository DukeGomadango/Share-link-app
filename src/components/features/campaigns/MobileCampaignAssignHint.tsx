"use client";

import { CollapsibleCallout } from "@/components/shared/CollapsibleCallout";
import { useTranslation } from "@/lib/i18n";

export function MobileCampaignAssignHint() {
  const { t } = useTranslation();

  return (
    <CollapsibleCallout
      title="ファイルの割り当て方法"
      dismissStorageKey="dango-campaign-assign-hint-dismissed"
      className="lg:hidden"
      tone="emerald"
    >
      <p>{t.mobile.campaignAssignHint}</p>
    </CollapsibleCallout>
  );
}
