"use client";

import { useState, useCallback } from "react";
import {
  DragEndEvent,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { FileItem, Recipient, LibraryFile } from "@/components/features/campaigns/types";

export function useCampaignDetail() {
  const [files, setFiles] = useState<FileItem[]>([
    { id: "f1", name: "good_morning_voice.wav", type: "audio" },
    { id: "f2", name: "special_photo.jpg", type: "image", previewUrl: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=200&auto=format&fit=crop" },
    { id: "f3", name: "thank_you_message.wav", type: "audio" },
  ]);

  const [recipients, setRecipients] = useState<Recipient[]>([
    { id: "r1", name: "Fan A", email: "fan.a@example.com", assignedFileIds: [] },
    { id: "r2", name: "Fan B", email: "fan.b@example.com", assignedFileIds: [] },
    { id: "r3", name: "Fan C", email: "fan.c@example.com", assignedFileIds: [] },
  ]);

  const [activeDragFile, setActiveDragFile] = useState<FileItem | null>(null);
  const [draggedFileIds, setDraggedFileIds] = useState<string[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [pulsedRecipientId, setPulsedRecipientId] = useState<string | null>(null);

  // ライブラリモーダル用状態
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [libraryFiles, setLibraryFiles] = useState<LibraryFile[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor)
  );

  const fetchLibraryFiles = useCallback(() => {
    fetch("/api/files")
      .then((r) => r.json())
      .then((data) => setLibraryFiles(data))
      .catch((e) => console.error(e));
  }, []);

  const handleRemoveFile = useCallback((recipientId: string, fileId: string) => {
    setRecipients((prev) =>
      prev.map((r) => {
        if (r.id === recipientId) {
          return {
            ...r,
            assignedFileIds: r.assignedFileIds.filter((id) => id !== fileId),
          };
        }
        return r;
      })
    );
  }, []);

  const toggleSelection = useCallback((fileId: string) => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const file = active.data.current?.file;
    if (!file) return;
    setActiveDragFile(file);
    const draggingSelection = selectedFileIds.has(file.id) && selectedFileIds.size > 1;
    setDraggedFileIds(draggingSelection ? Array.from(selectedFileIds) : [file.id]);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragFile(null);
    const sourceFileIds = draggedFileIds;
    setDraggedFileIds([]);

    if (over && over.id.toString().startsWith("recipient-")) {
      const recipientId = over.id.toString().replace("recipient-", "");
      const fallbackFileId = active.id.toString().replace("file-", "");
      const fileIdsToAssign = sourceFileIds.length > 0 ? sourceFileIds : [fallbackFileId];

      setRecipients(prev => prev.map(r => {
        if (r.id === recipientId) {
          const newFileIds = [...r.assignedFileIds];
          for (const fileId of fileIdsToAssign) {
            if (!newFileIds.includes(fileId)) {
              newFileIds.push(fileId);
            }
          }
          return { ...r, assignedFileIds: newFileIds, link: r.link || `/claim/${Math.random().toString(36).substring(7)}` };
        }
        return r;
      }));
      setPulsedRecipientId(recipientId);
      window.setTimeout(() => setPulsedRecipientId((prev) => (prev === recipientId ? null : prev)), 450);
      setSelectedFileIds(new Set());
    }
  };

  const addFilesToPool = (newItems: FileItem[]) => {
    setFiles(prev => [...prev, ...newItems]);
  };

  return {
    files,
    recipients,
    activeDragFile,
    draggedFileIds,
    selectedFileIds,
    pulsedRecipientId,
    showLibraryModal,
    setShowLibraryModal,
    libraryFiles,
    sensors,
    fetchLibraryFiles,
    handleRemoveFile,
    toggleSelection,
    handleDragStart,
    handleDragEnd,
    addFilesToPool,
  };
}
