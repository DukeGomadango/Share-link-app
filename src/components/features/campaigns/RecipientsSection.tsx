"use client";

import { Users, MailPlus } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { DroppableRecipient } from "@/components/features/campaigns/DroppableRecipient";
import { Recipient, FileItem } from "@/components/features/campaigns/types";

interface RecipientsSectionProps {
  recipients: Recipient[];
  files: FileItem[];
  pulsedRecipientId: string | null;
  onRemoveFile: (recipientId: string, fileId: string) => void;
}

export function RecipientsSection({
  recipients,
  files,
  pulsedRecipientId,
  onRemoveFile,
}: RecipientsSectionProps) {
  const { t } = useTranslation();
  return (
    <GlassCard className="flex flex-col overflow-hidden h-full">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/50 shrink-0">
        <h2 className="text-lg font-semibold flex items-center">
          <Users className="w-5 h-5 mr-2 text-blue-500" />
          {t.campaigns.recipients}
        </h2>
        <Button variant="ghost" size="sm" className="h-8 text-emerald-500 hover:text-emerald-600">
          <MailPlus className="w-4 h-4 mr-1" />
          {t.campaigns.addRecipients}
        </Button>
      </div>

      <div className="scrollbar-prominent overflow-y-auto flex-1 pr-2 grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-max pb-20">
        {recipients.map(recipient => (
          <DroppableRecipient
            key={recipient.id}
            recipient={recipient}
            getFile={(id) => files.find(f => f.id === id)}
            onRemoveFile={onRemoveFile}
            successPulse={pulsedRecipientId === recipient.id}
          />
        ))}
      </div>
    </GlassCard>
  );
}
