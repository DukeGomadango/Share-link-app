"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  DragEndEvent,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { toast } from "sonner";
import type {
  Campaign,
  FileItem,
  LibraryFile,
  Recipient,
  RecipientStatus,
} from "@/components/features/campaigns/types";
import { MAX_UPLOAD_BYTES } from "@/lib/storage/config";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { debounce } from "@/lib/utils";

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
  const router = useRouter();
  const campaignId = typeof params.id === "string" ? params.id : undefined;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [liveViewers, setLiveViewers] = useState(0);
  const [workflowLoading, setWorkflowLoading] = useState(true);
  const [workflowError, setWorkflowError] = useState<string | null>(null);

  const [activeDragFile, setActiveDragFile] = useState<FileItem | null>(null);
  const [activeDragRecipient, setActiveDragRecipient] = useState<Recipient | null>(null);
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

  const debouncedLoadWorkflow = useMemo(
    () => debounce((...args: unknown[]) => {
      void loadWorkflow(args[0] as { quiet?: boolean } | undefined);
    }, 500),
    [loadWorkflow]
  );

  useEffect(() => {
    // 初回読み込み
    const timer = setTimeout(() => {
      void loadWorkflow();
    }, 0);
    return () => clearTimeout(timer);
  }, [campaignId, loadWorkflow]); // campaignId が変わった時だけ（実質マウント時のみ）

  useEffect(() => {
    // リアルタイム監視 (Supabase Realtime) — だんごツール等の外部 API 更新も追随
    if (!campaignId) return;

    const refreshWorkflow = () => debouncedLoadWorkflow({ quiet: true });

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`admin-campaign-updates-${campaignId}`)
      // 新規 Claim（ガチャ連携でプレイヤー追加など）
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "claims",
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => {
          refreshWorkflow();
        }
      )
      // Claim 更新（開封・外部連携による配布ファイル差し替え後の updatedAt など）
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "claims",
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => {
          refreshWorkflow();
        }
      )
      // 受取スロットの変更（名前・ステータス・外部連携）
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "campaign_recipient_slots",
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => {
          refreshWorkflow();
        }
      )
      // ファイル割り当ての更新（既知スロットは差分パッチ、未知はフル再取得）
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "slot_assets",
        },
        (payload) => {
          const data = payload.eventType === "DELETE" ? payload.old : payload.new;
          const slotId = data.slot_id as string;
          const assetId = data.campaign_asset_id as string;

          let needsFullRefresh = false;
          setRecipients((prev) => {
            const hasSlot = prev.some((r) => r.id === slotId);
            if (!hasSlot) {
              needsFullRefresh = true;
              return prev;
            }

            return prev.map((r) => {
              if (r.id !== slotId) return r;
              const current = r.assignedFileIds || [];
              if (payload.eventType === "INSERT") {
                return { ...r, assignedFileIds: Array.from(new Set([...current, assetId])) };
              }
              if (payload.eventType === "DELETE") {
                return { ...r, assignedFileIds: current.filter((id) => id !== assetId) };
              }
              return r;
            });
          });
          if (needsFullRefresh) {
            refreshWorkflow();
          }
        }
      )
      // 受取スロットの新規・削除
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "campaign_recipient_slots",
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "DELETE") {
            refreshWorkflow();
          }
        }
      )
      // Presence (ライブ接続状況)
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        // 自分（admin）以外のユニークな接続をカウント
        const counts = Object.values(state).flat().filter((p) => (p as { user_type?: string })?.user_type !== "admin").length;
        setLiveViewers(counts);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // 管理者として存在をアピール（自分はカウントから除外するため）
          await channel.track({
            user_type: "admin",
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [campaignId, debouncedLoadWorkflow]);

  // 別タブ（だんごツール）で同期したあと戻ってきたとき用。ポーリングは使わない。
  useEffect(() => {
    if (!campaignId) return;

    const onResume = () => {
      if (document.visibilityState === "visible") {
        debouncedLoadWorkflow({ quiet: true });
      }
    };

    document.addEventListener("visibilitychange", onResume);
    window.addEventListener("focus", onResume);
    return () => {
      document.removeEventListener("visibilitychange", onResume);
      window.removeEventListener("focus", onResume);
    };
  }, [campaignId, debouncedLoadWorkflow]);

  const fetchLibraryFiles = useCallback(() => {
    fetch("/api/files")
      .then((r) => r.json())
      .then((data) => {
        const files = Array.isArray(data) ? data : (data.files || []);
        setLibraryFiles(files as LibraryFile[]);
      })
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
      toast.success("ライブラリからファイルを追加しました");
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
      toast.success("ファイルをアップロードして追加しました");
    },
    [campaignId, loadWorkflow]
  );

  const handleFilesDropped = useCallback(
    async (droppedFiles: File[]) => {
      const ids: string[] = [];
      const tooLargeFiles = droppedFiles.filter(f => f.size > MAX_UPLOAD_BYTES);
      const validFiles = droppedFiles.filter(f => f.size <= MAX_UPLOAD_BYTES);

      if (tooLargeFiles.length > 0) {
        toast.error(`${tooLargeFiles.length} 件のファイルが制限（50MB）を超えているためスキップされました。`);
      }

      for (const file of validFiles) {
        try {
          ids.push(await uploadLibraryAssetFromFile(file));
        } catch (e) {
          console.error(e);
          toast.error(`${file.name} のアップロードに失敗しました。`);
        }
      }
      if (ids.length > 0) {
        await assignUploadedAssets(ids);
      }
    },
    [assignUploadedAssets]
  );

  const handleRemoveFile = useCallback(
    async (recipientId: string, fileId: string) => {
      if (!campaignId) return;

      // Local Update for immediate feedback
      setRecipients(prev => prev.map(r => {
        if (r.id === recipientId) {
          return {
            ...r,
            assignedFileIds: (r.assignedFileIds || []).filter(id => id !== fileId)
          };
        }
        return r;
      }));

      const res = await fetch(
        `/api/campaigns/${campaignId}/recipient-slots/${recipientId}/assign`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ campaignAssetId: fileId, action: "remove" }),
        }
      );
      
      if (!res.ok) {
        // Rollback on error
        toast.error("割り当ての解除に失敗しました");
        await loadWorkflow({ quiet: true });
      } else {
        // Just sync to be sure
        void loadWorkflow({ quiet: true });
      }
    },
    [campaignId, loadWorkflow]
  );

  const handleRemoveRecipient = useCallback(
    async (id: string) => {
      if (!campaignId) return;

      // Local Update
      setRecipients(prev => prev.filter(r => r.id !== id));

      const res = await fetch(`/api/campaigns/${campaignId}/recipient-slots/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("受取人の削除に失敗しました。時間をおいて再度お試しください。");
        await loadWorkflow({ quiet: true });
      } else {
        void loadWorkflow({ quiet: true });
      }
    },
    [campaignId, loadWorkflow]
  );

  const toggleSelection = useCallback((fileId: string) => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  }, []);

  const setSelectedFiles = useCallback((ids: string[]) => {
    setSelectedFileIds(new Set(ids));
  }, []);

  const toggleAllSelection = useCallback(() => {
    setSelectedFileIds((prev) => {
      if (prev.size === files.length && files.length > 0) {
        return new Set();
      } else {
        return new Set(files.map((f) => f.id));
      }
    });
  }, [files]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current;
    
    // 受取人のドラッグ開始
    if (data?.type === 'recipient') {
      setActiveDragRecipient(data.recipient as Recipient);
      return;
    }

    const file = data?.file as FileItem | undefined;
    if (!file) return;
    setActiveDragFile(file);
    const draggingSelection =
      selectedFileIds.has(file.id) && selectedFileIds.size > 1;
    setDraggedFileIds(draggingSelection ? Array.from(selectedFileIds) : [file.id]);
  }, [selectedFileIds]);

  const [pulsedRecipientId, setPulsedRecipientId] = useState<string | null>(null);

  const handleMergeRecipients = useCallback(
    async (sourceSlotId: string, targetSlotId: string) => {
      if (!campaignId) return;
      const res = await fetch(`/api/campaigns/${campaignId}/recipient-slots/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceSlotId, targetSlotId }),
      });
      if (res.ok) {
        await loadWorkflow({ quiet: true });
        toast.success("受取人を統合しました");
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(`統合に失敗しました: ${err.error || "サーバーエラーが発生しました"}`);
      }
    },
    [campaignId, loadWorkflow]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      
      // クリーンアップ
      setActiveDragFile(null);
      setActiveDragRecipient(null);
      setDraggedFileIds([]);

      if (!over || !campaignId || campaign?.status === "draft") {
        return;
      }

      const activeData = active.data.current;
      const overData = over.data.current;

      // 受取人カード同士のドラッグ（統合）
      if (activeData?.type === "recipient" && overData?.type === "recipient") {
        const sourceId = activeData.recipient.id;
        const targetId = overData.recipient.id;
        if (sourceId !== targetId) {
          if (confirm(`${activeData.recipient.name} さんを ${overData.recipient.name} さんに統合しますか？\n（事前準備されていたファイルも引き継がれます）`)) {
            await handleMergeRecipients(sourceId, targetId);
          }
        }
        return;
      }

      const overId = over.id.toString();
      if (!overId.startsWith("recipient-")) {
        setActiveDragFile(null);
        setDraggedFileIds([]);
        return;
      }

      const claimId = overId.replace(/^recipient-/, "");
      
      const activeFile = active.data.current?.file as FileItem | undefined;
      let targetIds = [...draggedFileIds];
      if (targetIds.length === 0 && activeFile) {
        targetIds = [activeFile.id];
      }

      if (targetIds.length > 0) {
        // Local Update for all target files
        setRecipients(prev => prev.map(r => {
          if (r.id === claimId) {
            const currentIds = r.assignedFileIds || [];
            const newIds = Array.from(new Set([...currentIds, ...targetIds]));
            return { ...r, assignedFileIds: newIds, status: 'verified' as RecipientStatus };
          }
          return r;
        }));

        await Promise.all(
          targetIds.map((fid) =>
            fetch(`/api/campaigns/${campaignId}/recipient-slots/${claimId}/assign`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ campaignAssetId: fid }),
            })
          )
        );
        
        setPulsedRecipientId(claimId);
        setTimeout(() => setPulsedRecipientId(null), 2000);
        
        await loadWorkflow({ quiet: true });
      }

      setActiveDragFile(null);
      setDraggedFileIds([]);
      setSelectedFileIds(new Set());
    },
    [campaign?.status, campaignId, draggedFileIds, handleMergeRecipients, loadWorkflow]
  );

  const deleteCampaign = useCallback(async () => {
    if (!campaignId) return false;
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("キャンペーンを削除しました");
      router.push("/campaigns");
      return true;
    } catch {
      toast.error("キャンペーンの削除に失敗しました");
      return false;
    }
  }, [campaignId, router]);

  const handleUnassignFromCampaign = useCallback(
    async (fileIds: string[]) => {
      if (!campaignId || fileIds.length === 0) return;
      
      const res = await fetch("/api/files/unassign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, assetIds: fileIds }),
      });

      if (res.ok) {
        setSelectedFileIds(new Set());
        await loadWorkflow();
        toast.success("ファイルをキャンペーンから外しました");
      } else {
        toast.error("ファイルの解除に失敗しました");
      }
    },
    [campaignId, loadWorkflow]
  );
  
  const handleUpdateGachaConfig = useCallback(
    async (config: Campaign["gachaConfig"]) => {
      if (!campaignId) return;
      const r = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gachaConfig: config }),
      });
      if (r.ok) await loadWorkflow({ quiet: true });
    },
    [campaignId, loadWorkflow]
  );

  const handleUpdateFileRarity = useCallback(
    async (fileId: string, rarityId: string | null) => {
      if (!campaignId) return;
      const r = await fetch(`/api/campaigns/${campaignId}/assets/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gachaRarityId: rarityId }),
      });
      if (r.ok) {
        // Local update for immediate feedback
        setFiles(prev => prev.map(f => f.id === fileId ? { ...f, gachaRarityId: rarityId || undefined } : f));
        toast.success("レアリティを更新しました");
      }
    },
    [campaignId]
  );

  return {
    campaignId,
    campaign,
    workflowLoading,
    workflowError,
    files,
    recipients,
    activeDragFile,
    activeDragRecipient,
    draggedFileIds,
    selectedFileIds,
    pulsedRecipientId,
    showLibraryModal,
    setShowLibraryModal,
    libraryFiles,
    sensors,
    fetchLibraryFiles,
    assignFromLibrary,
    handleUnassignFromCampaign,
    handleRemoveFile,
    handleRemoveRecipient,
    handleMergeRecipients,
    toggleSelection,
    setSelectedFiles,
    toggleAllSelection,
    handleDragStart,
    handleDragEnd,
    handleFilesDropped,
    deleteCampaign,
    handleUpdateGachaConfig,
    handleUpdateFileRarity,
    reloadWorkflow: loadWorkflow,
    liveViewers,
  };
}
