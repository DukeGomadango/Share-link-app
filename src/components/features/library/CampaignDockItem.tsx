"use client";

import { motion } from "framer-motion";
import { useDroppable } from "@dnd-kit/core";
import { Loader2 } from "lucide-react";
import { CampaignSummary } from "./types";

interface CampaignDockItemProps {
  campaign: CampaignSummary;
  disabled: boolean;
  assigning: boolean;
  successPulse: boolean;
  compact?: boolean;
  onAssign: () => void;
  assignSelectedHint: string;
}

export function CampaignDockItem({
  campaign,
  disabled,
  assigning,
  successPulse,
  compact = false,
  onAssign,
  assignSelectedHint,
}: CampaignDockItemProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `campaign-drop-${campaign.id}`,
  });

  return (
    <motion.button
      ref={setNodeRef}
      type="button"
      initial={false}
      animate={
        successPulse
          ? {
              scale: [1, 1.02, 1],
              boxShadow: [
                "0 0 0 rgba(16,185,129,0)",
                "0 0 0 6px rgba(16,185,129,0.18)",
                "0 0 0 rgba(16,185,129,0)",
              ],
            }
          : undefined
      }
      transition={{ duration: 0.42, ease: "easeOut" }}
      className={`${compact ? "w-[180px] min-w-[180px]" : "w-full"} text-left p-3 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        isOver
          ? "border-emerald-500 bg-emerald-500/20"
          : successPulse
          ? "border-emerald-500 bg-emerald-500/10"
          : "border-border/60 hover:border-emerald-500/50 hover:bg-emerald-500/5"
      }`}
      disabled={disabled || assigning}
      onClick={onAssign}
    >
      <p className="text-sm font-medium line-clamp-1 flex items-center gap-2">
        {assigning ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" /> : null}
        {campaign.name}
      </p>
      <p className="text-xs text-muted-foreground mt-1">{assignSelectedHint}</p>
    </motion.button>
  );
}
