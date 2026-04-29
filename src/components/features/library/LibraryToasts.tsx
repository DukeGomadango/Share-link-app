"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AssignResult } from "@/components/features/library/types";

interface LibraryToastsProps {
  showUndoToast: boolean;
  showAssignErrorToast: boolean;
  lastAssignResult: AssignResult;
  hasUndoSnapshot: boolean;
  onUndo: () => void;
  labels: {
    assignComplete: string;
    assignTarget: string;
    assignAdded: string;
    assignSkipped: string;
    undo: string;
    assignRestoreErrorTitle: string;
    assignRestoreErrorBody: string;
  };
}

export function LibraryToasts({
  showUndoToast,
  showAssignErrorToast,
  lastAssignResult,
  hasUndoSnapshot,
  onUndo,
  labels,
}: LibraryToastsProps) {
  return (
    <>
      <AnimatePresence>
        {showUndoToast ? (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.8 }}
            className="fixed right-4 bottom-4 z-[60] w-full max-w-sm rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-xl p-4"
          >
            <p className="text-sm font-medium">{labels.assignComplete}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {labels.assignTarget.replace("{campaign}", lastAssignResult.campaignName || "-")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {labels.assignAdded.replace("{count}", String(lastAssignResult.added))}
            </p>
            <p className="text-xs text-muted-foreground">
              {labels.assignSkipped.replace("{count}", String(lastAssignResult.skipped))}
            </p>
            {hasUndoSnapshot ? (
              <div className="mt-3 flex justify-end">
                <Button variant="outline" size="sm" onClick={onUndo}>
                  {labels.undo}
                </Button>
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {showAssignErrorToast ? (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.8 }}
            className="fixed right-4 bottom-4 z-[60] w-full max-w-sm rounded-xl border border-red-500/50 bg-red-500/10 backdrop-blur-sm shadow-xl p-4"
          >
            <p className="text-sm font-medium text-red-600">{labels.assignRestoreErrorTitle}</p>
            <p className="text-xs text-red-700 mt-1">{labels.assignRestoreErrorBody}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
