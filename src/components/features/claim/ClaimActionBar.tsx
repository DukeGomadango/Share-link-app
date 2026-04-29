"use client";

import { motion } from "framer-motion";
import { CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClaimActionBarProps {
  itemCount: number;
  allSelected: boolean;
  onSelectAll: () => void;
}

export function ClaimActionBar({ itemCount, allSelected, onSelectAll }: ClaimActionBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="flex items-center justify-between mb-4 border-b border-border/40 pb-4"
    >
      <div className="flex items-center space-x-2">
        <span className="text-sm text-muted-foreground">
          {itemCount} items
        </span>
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onSelectAll}
        className="text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
      >
        {allSelected ? (
          <><CheckSquare className="w-4 h-4 mr-2" /> Deselect All</>
        ) : (
          <><Square className="w-4 h-4 mr-2" /> Select All</>
        )}
      </Button>
    </motion.div>
  );
}
