"use client";

import { AlertCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive" | "emerald";
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "確定",
  cancelText = "キャンセル",
  variant = "default",
  isLoading = false,
}: ConfirmModalProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <DialogHeader className="space-y-4">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center mb-2",
          variant === "destructive" ? "bg-red-500/10 text-red-500" : 
          variant === "emerald" ? "bg-emerald-500/10 text-emerald-500" :
          "bg-blue-500/10 text-blue-500"
        )}>
          {variant === "destructive" ? (
            <AlertCircle className="w-6 h-6" />
          ) : (
            <HelpCircle className="w-6 h-6" />
          )}
        </div>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          {description}
        </DialogDescription>
      </DialogHeader>
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Button
          variant="ghost"
          onClick={onClose}
          disabled={isLoading}
          className="flex-1 rounded-2xl h-12 text-muted-foreground hover:bg-muted"
        >
          {cancelText}
        </Button>
        <Button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          disabled={isLoading}
          className={cn(
            "flex-1 rounded-2xl h-12 font-bold shadow-lg transition-all active:scale-95",
            variant === "destructive" ? "bg-red-500 hover:bg-red-600 shadow-red-500/20 text-white" :
            variant === "emerald" ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20 text-white" :
            "bg-foreground text-background hover:opacity-90 shadow-foreground/10"
          )}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            confirmText
          )}
        </Button>
      </div>
    </Dialog>
  );
}
