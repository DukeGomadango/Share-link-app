"use client";

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileDropzoneProps {
  onFilesDropped: (files: File[]) => void;
  className?: string;
}

export function FileDropzone({ onFilesDropped, className }: FileDropzoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesDropped(acceptedFiles);
  }, [onFilesDropped]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all glass-panel",
        isDragActive 
          ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20" 
          : "border-border/50 hover:border-emerald-500/50 hover:bg-emerald-500/5",
        className
      )}
    >
      <input {...getInputProps()} />
      <UploadCloud className={cn("w-10 h-10 mb-4 transition-colors", isDragActive ? "text-emerald-500" : "text-muted-foreground")} />
      <p className="text-sm font-medium text-foreground">
        {isDragActive ? "Drop files here... ✨" : "Drag & drop files here"}
      </p>
      <p className="text-xs text-muted-foreground mt-2 text-center max-w-xs">
        Supported formats: PNG, JPG, MP3, WAV. Max size: 50MB. (Watermarks automatically applied)
      </p>
    </div>
  );
}
