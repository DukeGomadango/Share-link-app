"use client";

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from "@/lib/i18n";

interface FileDropzoneProps {
  onFilesDropped: (files: File[]) => void;
  className?: string;
}

export function FileDropzone({ onFilesDropped, className }: FileDropzoneProps) {
  const { t } = useTranslation();
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesDropped(acceptedFiles);
  }, [onFilesDropped]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div
      {...getRootProps()}
      className={cn(
        // Light Skeuomorphism: 点線ではなく立体的な浮遊感で直感的操作を誘導
        "relative rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer",
        "transition-all duration-300 ease-out",
        "border border-border/40",
        "bg-gradient-to-b from-background to-muted/30",
        "shadow-[0_2px_8px_oklch(0_0_0/0.04),inset_0_1px_0_oklch(1_0_0/0.5)]",
        // ホバー時: 面全体がわずかに浮き上がり、受け入れ準備を表現
        "hover:shadow-[0_8px_24px_oklch(0.645_0.165_158.452/0.12),inset_0_1px_0_oklch(1_0_0/0.6)]",
        "hover:-translate-y-0.5 hover:border-emerald-500/40",
        "hover:bg-gradient-to-b hover:from-emerald-500/5 hover:to-transparent",
        // ドラッグ中: 明確な「ここに落とせる」フィードバック
        isDragActive && [
          "border-emerald-500/60 bg-gradient-to-b from-emerald-500/10 to-emerald-500/5",
          "shadow-[0_12px_32px_oklch(0.645_0.165_158.452/0.2),inset_0_1px_0_oklch(1_0_0/0.7)]",
          "-translate-y-1 scale-[1.01]",
        ],
        // ダークモード用の微調整
        "dark:shadow-[0_2px_8px_oklch(0_0_0/0.2),inset_0_1px_0_oklch(1_0_0/0.05)]",
        "dark:hover:shadow-[0_8px_24px_oklch(0.645_0.165_158.452/0.15),inset_0_1px_0_oklch(1_0_0/0.08)]",
        className
      )}
    >
      <input {...getInputProps()} />

      {/* アイコン - ドラッグ時に浮き上がるアニメーション */}
      <div className={cn(
        "mb-4 p-4 rounded-xl transition-all duration-300",
        isDragActive
          ? "bg-emerald-500/15 scale-110 -translate-y-1"
          : "bg-muted/50 group-hover:bg-emerald-500/10"
      )}>
        <UploadCloud className={cn(
          "w-8 h-8 transition-colors duration-300",
          isDragActive ? "text-emerald-500" : "text-muted-foreground"
        )} />
      </div>

      <p className="text-sm font-medium text-foreground">
        {isDragActive ? t.library.uploadArea.drop : t.library.uploadArea.drag}
      </p>
      <p className="text-xs text-muted-foreground mt-2 text-center max-w-xs">
        {t.library.uploadArea.description}
      </p>
    </div>
  );
}
