"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SheetProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

export function Sheet({ children, isOpen, onClose }: SheetProps) {
  // ESC key to close
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm"
          />
          {/* Content */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-[101] h-full w-full max-w-md border-l border-border/50 bg-background/95 shadow-2xl backdrop-blur-xl"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-10 flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
              aria-label="閉じる"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="h-full overflow-y-auto custom-scrollbar">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function SheetHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("px-8 pt-10 pb-6 border-b border-border/30", className)}>
      {children}
    </div>
  );
}

export function SheetBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("px-8 py-6", className)}>
      {children}
    </div>
  );
}

export function SheetFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("px-8 py-6 border-t border-border/30 mt-auto", className)}>
      {children}
    </div>
  );
}

export function SheetTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-bold tracking-tight text-foreground">{children}</h2>;
}

export function SheetDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground mt-1">{children}</p>;
}
