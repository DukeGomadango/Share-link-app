"use client";

import { useDraggable } from "@dnd-kit/core";
import Image from "next/image";
import { FileAudio, FileImage } from "lucide-react";
import { FileItem } from "./types";

interface DraggableFileItemProps {
  file: FileItem;
}

export function DraggableFileItem({ file }: DraggableFileItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `file-${file.id}`,
    data: { file },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-3 rounded-lg border bg-background/50 flex items-center space-x-3 cursor-grab active:cursor-grabbing hover:border-emerald-500/50 transition-colors ${
        isDragging ? "opacity-50 ring-2 ring-emerald-500 shadow-xl" : "border-border/50"
      }`}
    >
      <div className="p-2 bg-emerald-500/10 rounded-md text-emerald-500 shrink-0 relative overflow-hidden flex items-center justify-center w-10 h-10">
        {file.type === "image" && file.previewUrl ? (
          <Image src={file.previewUrl} alt={file.name} fill className="object-cover" unoptimized />
        ) : file.type === "audio" ? (
          <FileAudio className="w-5 h-5" />
        ) : (
          <FileImage className="w-5 h-5" />
        )}
      </div>
      <div className="overflow-hidden">
        <p className="text-sm font-medium line-clamp-1">{file.name}</p>
        <p className="text-xs text-muted-foreground">{file.type === "audio" ? "Voice" : "Image"}</p>
      </div>
    </div>
  );
}
