"use client";

import { motion } from "framer-motion";
import { useDroppable } from "@dnd-kit/core";
import { Search } from "lucide-react";

interface CampaignSearchDropZoneProps {
  disabled: boolean;
  onClick: () => void;
  title: string;
  hint: string;
}

export function CampaignSearchDropZone({
  disabled,
  onClick,
  title,
  hint,
}: CampaignSearchDropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({ id: "campaign-search-drop" });

  return (
    <motion.button
      ref={setNodeRef}
      type="button"
      initial={false}
      whileTap={{ scale: 0.99 }}
      className={`w-[220px] min-w-[220px] text-left p-3 rounded-lg border border-dashed transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        isOver
          ? "border-emerald-500 bg-emerald-500/20"
          : "border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10"
      }`}
      disabled={disabled}
      onClick={onClick}
    >
      <p className="text-sm font-medium line-clamp-1 flex items-center gap-2">
        <Search className="w-3.5 h-3.5 text-emerald-500" />
        {title}
      </p>
      <p className="text-xs text-muted-foreground mt-1">{hint}</p>
    </motion.button>
  );
}
