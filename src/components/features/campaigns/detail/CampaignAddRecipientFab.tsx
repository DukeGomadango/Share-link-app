"use client";

import { MailPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

type CampaignAddRecipientFabProps = {
  visible: boolean;
  disabled: boolean;
  isDraft: boolean;
  onAdd: () => void;
  onPublish: () => void;
};

/** 受取人タブ時のプライマリ追加導線（ボトムナビ上） */
export function CampaignAddRecipientFab({
  visible,
  disabled,
  isDraft,
  onAdd,
  onPublish,
}: CampaignAddRecipientFabProps) {
  const { t } = useTranslation();

  if (!visible) return null;

  const handleClick = () => {
    if (isDraft) {
      onPublish();
      return;
    }
    onAdd();
  };

  return (
    <div
      className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-40 flex justify-center px-3 lg:hidden"
      role="region"
      aria-label={t.campaigns.addRecipients}
    >
      <Button
        type="button"
        size="touch"
        className="w-full max-w-lg bg-emerald-500 text-white shadow-xl hover:bg-emerald-600"
        disabled={!isDraft && disabled}
        onClick={handleClick}
      >
        <MailPlus className="mr-2 size-5" />
        {isDraft ? t.mobile.addRecipientsPublishFirst : t.campaigns.addRecipients}
      </Button>
    </div>
  );
}
