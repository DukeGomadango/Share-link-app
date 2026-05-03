"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  DragEndEvent,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type {
  Campaign,
  FileItem,
  LibraryFile,
  Recipient,
} from "@/components/features/campaigns/types";

async function uploadLibraryAssetFromFile(file: File): Promise<string> {
  const init = await fetch("/api/files/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      size: file.size,
      contentType: file.type || "application/octet-stream",
    }),
  });
  if (!init.ok) {
    throw new Error(`upload-url failed: ${init.status}`);
  }
  const meta = (await init.json()) as {
    uploadUrl: string;
    assetId: string;
    objectKey: string;
    contentType: string;
    token?: string;
  };

  const putHeaders: Record<string, string> = {
    "Content-Type": meta.contentType || file.type || "application/octet-stream",
    "x-upsert": "true",
  };
  if (meta.token) {
    putHeaders.Authorization = `Bearer ${meta.token}`;
  }

  let uploadUrl = meta.uploadUrl;
  if (uploadUrl.startsWith("/")) {
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
    if (baseUrl) {
      uploadUrl = `${baseUrl}${uploadUrl}`;
    }
  }

  const put = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: putHeaders,
  });

  if (!put.ok) {
    const errorBody = await put.text().catch(() => "");
    console.error("Storage upload failed:", {
      status: put.status,
      statusText: put.statusText,
      body: errorBody,
      url: uploadUrl,
    });
    throw new Error(`storage upload failed: ${put.status} ${errorBody}`);
  }

  const reg = await fetch("/api/files/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      assetId: meta.assetId,
      objectKey: meta.objectKey,
      originalFilename: file.name,
      sizeBytes: file.size,
      mimeType: file.type || "application/octet-stream",
    }),
  });
  if (!reg.ok) {
    throw new Error(`register failed: ${reg.status}`);
  }
  return meta.assetId;
}

export function useCampaignDetail() {
  const params = useParams();
  const campaignId = typeof params.id === "string" ? params.id : undefined;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [workflowLoading, setWorkflowLoading] = useState(true);
  const [workflowError, setWorkflowError] = useState<string | null>(null);

  const [activeDragFile, setActiveDragFile] = useState<FileItem | null>(null);
  const [draggedFileIds, setDraggedFileIds] = useState<string[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());

  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [libraryFiles, setLibraryFiles] = useState<LibraryFile[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor)
  );

  const loadWorkflow = useCallback(
    async (opts?: { quiet?: boolean }) => {
      if (!campaignId) return;
      if (!opts?.quiet) setWorkflowLoading(true);
      try {
        const r = await fetch(`/api/campaigns/${campaignId}/workflow`);
        if (!r.ok) throw new Error(String(r.status));
        const data = (await r.json()) as {
          campaign: Campaign;
          poolFiles: FileItem[];
          recipients: Recipient[];
        };
        setCampaign(data.campaign);
        setFiles(data.poolFiles);
        setRecipients(data.recipients);
        setWorkflowError(null);
      } catch {
        if (!opts?.quiet) setWorkflowError("読み込みに失敗しました");
      } finally {
        if (!opts?.quiet) setWorkflowLoading(false);
      }
    },
    [campaignId]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- マウント時に workflow GET（非同期）
    void loadWorkflow();
  }, [loadWorkflow]);

  useEffect(() => {
    if (campaign?.distributionMode !== "reception") return;
    const timer = setInterval(() => void loadWorkflow({ quiet: true }), 6000);
    return () => clearInterval(timer);
  }, [campaign?.distributionMode, loadWorkflow]);

  const fetchLibraryFiles = useCallback(() => {
    fetch("/api/files")
      .then((r) => r.json())
      .then((data) => setLibraryFiles(data as LibraryFile[]))
      .catch((e) => console.error(e));
  }, []);

  const assignFromLibrary = useCallback(
    async (libraryAssetIds: string[]) => {
      if (!campaignId || libraryAssetIds.length === 0) return;
      await fetch("/api/files/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileIds: libraryAssetIds,
          campaignId,
        }),
      });
      await loadWorkflow();
    },
    [campaignId, loadWorkflow]
  );

  const assignUploadedAssets = useCallback(
    async (assetIds: string[]) => {
      if (!campaignId || assetIds.length === 0) return;
      await fetch("/api/files/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: assetIds, campaignId }),
      });
      await loadWorkflow();
    },
    [campaignId, loadWorkflow]
  );

  const handleFilesDropped = useCallback(
    async (droppedFiles: File[]) => {
      const ids: string[] = [];
      for (const file of droppedFiles) {
        try {
          ids.push(await uploadLibraryAssetFromFile(file));
        } catch (e) {
          console.error(e);
        }
      }
      await assignUploadedAssets(ids);
    },
    [assignUploadedAssets]
  );

  const handleRemoveFile = useCallback((recipientId: string, fileId: string) => {
    void recipientId;
    void fileId;
  }, []);

  const toggleSelection = useCallback((fileId: string) => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const file = event.active.data.current?.file as FileItem | undefined;
    if (!file) return;
    setActiveDragFile(file);
    const draggingSelection =
      selectedFileIds.has(file.id) && selectedFileIds.size > 1;
    setDraggedFileIds(draggingSelection ? Array.from(selectedFileIds) : [file.id]);
  }, [selectedFileIds]);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveDragFile(null);
      setDraggedFileIds([]);
      setSelectedFileIds(new Set());

      if (
        !over ||
        !campaignId ||
        campaign?.distributionMode !== "reception"
      ) {
        return;
      }

      const file = active.data.current?.file as FileItem | undefined;
      const overId = over.id.toString();
      if (!file || !overId.startsWith("recipient-")) return;

      const claimId = overId.replace(/^recipient-/, "");
      const res = await fetch(
        `/api/campaigns/${campaignId}/claims/${claimId}/assign`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ campaignAssetId: file.id }),
        }
      );
      if (res.ok) {
        await loadWorkflow({ quiet: true });
      }
    },
    [campaign?.distributionMode, campaignId, loadWorkflow]
  );

  return {
    campaignId,
    campaign,
    workflowLoading,
    workflowError,
    files,
    recipients,
    activeDragFile,
    draggedFileIds,
    selectedFileIds,
    pulsedRecipientId: null as string | null,
    showLibraryModal,
    setShowLibraryModal,
    libraryFiles,
    sensors,
    fetchLibraryFiles,
    assignFromLibrary,
    handleRemoveFile,
    toggleSelection,
    handleDragStart,
    handleDragEnd,
    handleFilesDropped,
    reloadWorkflow: loadWorkflow,
  };
}
