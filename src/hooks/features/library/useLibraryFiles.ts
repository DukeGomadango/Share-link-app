"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { AssetFile } from "@/components/features/library/types";
import { MAX_UPLOAD_BYTES } from "@/lib/storage/config";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { debounce } from "@/lib/utils";
import { useWorkspaceStats } from "@/hooks/features/workspace/useWorkspaceStats";
import { useTranslation } from "@/lib/i18n";

export function useLibraryFiles() {
  const { t } = useTranslation();
  const [files, setFiles] = useState<AssetFile[]>([]);
  const [storageStats, setStorageStats] = useState<{ usedBytes: number; limitBytes: number; planTier: string }>({
    usedBytes: 0,
    limitBytes: 2147483648,
    planTier: "free",
  });
  const [fileTypeFilter, setFileTypeFilter] = useState<"all" | "image" | "audio">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [sizeFilter, setSizeFilter] = useState<"all" | "small" | "medium" | "large">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "7d" | "30d" | "90d">("all");
  const [selectedTag, setSelectedTag] = useState("all");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [nowTs] = useState(() => Date.now());
  const { stats: workspaceStats } = useWorkspaceStats();

  const fetchFiles = useCallback(() => {
    fetch("/api/files")
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((data) => {
        setFiles(data.files as AssetFile[]);
        if (data.stats) {
          setStorageStats(data.stats);
        }
      })
      .catch((e) => console.error("Failed to fetch files:", e));
  }, []);

  const debouncedFetchFiles = useMemo(
    () => debounce(() => fetchFiles(), 500),
    [fetchFiles]
  );

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // リアルタイム更新 (Supabase Realtime)
  useEffect(() => {
    const workspaceId = workspaceStats?.workspaceId;
    if (!workspaceId) return;

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`library-updates-${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "assets",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          const updated = payload.new;
          setFiles((prev) =>
            prev.map((f) =>
              f.id === updated.id
                ? {
                    ...f,
                    name: updated.original_filename,
                    size: updated.size_bytes,
                  }
                : f
            )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assets",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "DELETE") {
            debouncedFetchFiles();
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [workspaceStats?.workspaceId, debouncedFetchFiles]);

  const uploadSingle = useCallback(async (file: File) => {
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
      const err = (await init.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      if (err.error === "quota_exceeded") {
        throw new Error(t.library.quotaExceeded);
      }
      throw new Error(
        typeof err?.message === "string" ? err.message : `upload-url failed: ${init.status}`
      );
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
    };
    if (meta.token) {
      putHeaders.Authorization = `Bearer ${meta.token}`;
    }

    const put = await fetch(meta.uploadUrl, {
      method: "PUT",
      body: file,
      headers: putHeaders,
    });
    if (!put.ok) {
      throw new Error(`storage upload failed: ${put.status}`);
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
      const err = (await reg.json().catch(() => ({}))) as { error?: string };
      if (err.error === "quota_exceeded") {
        throw new Error(t.library.quotaExceeded);
      }
      throw new Error(
        typeof err?.error === "string" ? err.error : `register failed: ${reg.status}`
      );
    }
    return meta.assetId;
  }, [t.library.quotaExceeded]);

  const handleFilesDropped = async (droppedFiles: File[]) => {
    setUploadError(null);
    const tooLargeFiles = droppedFiles.filter(f => f.size > MAX_UPLOAD_BYTES);
    const validFiles = droppedFiles.filter(f => f.size <= MAX_UPLOAD_BYTES);

    if (tooLargeFiles.length > 0) {
      toast.error(`${tooLargeFiles.length} 件のファイルが制限（50MB）を超えているためスキップされました。`);
    }

    const newAssetIds: string[] = [];
    for (const file of validFiles) {
      try {
        const id = await uploadSingle(file);
        newAssetIds.push(id);
      } catch (error) {
        console.error("Upload error:", error);
        const msg = error instanceof Error ? error.message : "アップロードに失敗しました";
        setUploadError(msg);
        toast.error(`${file.name} のアップロードに失敗しました。`);
      }
    }
    fetchFiles();
    if (newAssetIds.length > 0) {
      toast.success(`${newAssetIds.length} 件のファイルを追加しました`);
    }
    return newAssetIds;
  };

  const inferSmartTags = useCallback((file: AssetFile) => {
    const tags = new Set<string>();
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (file.type.startsWith("image/")) tags.add("image");
    else if (file.type.startsWith("audio/")) tags.add("audio");
    else tags.add("other");
    if (ext) tags.add(ext);
    if (file.size >= 10 * 1024 * 1024) tags.add("large");
    if (file.linkedCampaigns.length === 0) tags.add("unassigned");
    return Array.from(tags);
  }, []);

  const smartTags = useMemo(() => {
    const counts = new Map<string, number>();
    files.forEach((file) => {
      inferSmartTags(file).forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1));
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([tag]) => tag);
  }, [files, inferSmartTags]);

  const filteredFiles = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return files.filter((file) => {
      if (fileTypeFilter === "image" && !file.type.startsWith("image/")) return false;
      if (fileTypeFilter === "audio" && !file.type.startsWith("audio/")) return false;
      if (unassignedOnly && file.linkedCampaigns.length > 0) return false;

      if (sizeFilter !== "all") {
        if (sizeFilter === "small" && file.size >= 1024 * 1024) return false;
        if (sizeFilter === "medium" && (file.size < 1024 * 1024 || file.size >= 10 * 1024 * 1024))
          return false;
        if (sizeFilter === "large" && file.size < 10 * 1024 * 1024) return false;
      }

      if (dateFilter !== "all") {
        const createdAt = new Date(file.createdAt).getTime();
        const days = dateFilter === "7d" ? 7 : dateFilter === "30d" ? 30 : 90;
        if (nowTs - createdAt > days * 24 * 60 * 60 * 1000) return false;
      }

      if (selectedTag !== "all" && !inferSmartTags(file).includes(selectedTag)) return false;

      if (normalizedQuery) {
        const haystack = `${file.name} ${file.linkedCampaigns.join(" ")}`.toLowerCase();
        if (!haystack.includes(normalizedQuery)) return false;
      }
      return true;
    });
  }, [
    files,
    fileTypeFilter,
    unassignedOnly,
    sizeFilter,
    dateFilter,
    selectedTag,
    searchQuery,
    inferSmartTags,
    nowTs,
  ]);

  const unassignedCount = useMemo(
    () => files.filter((file) => file.linkedCampaigns.length === 0).length,
    [files]
  );

  const handleRename = useCallback(async (fileId: string, newName: string) => {
    const r = await fetch(`/api/files/${encodeURIComponent(fileId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    if (!r.ok) throw new Error(`Rename failed: ${r.status}`);
    
    // ローカルステートを更新
    setFiles((prev) => 
      prev.map((f) => f.id === fileId ? { ...f, name: newName } : f)
    );
  }, []);

  const handleDelete = useCallback(async (fileId: string) => {
    const r = await fetch(`/api/files/${encodeURIComponent(fileId)}`, {
      method: "DELETE",
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.message || `Delete failed: ${r.status}`);
    }
    
    // ローカルステートを更新
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  const handleBulkDelete = useCallback(async (fileIds: string[]) => {
    const results = await Promise.allSettled(
      fileIds.map(async (id) => {
        const r = await fetch(`/api/files/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          throw new Error(err.message || String(r.status));
        }
        return id;
      })
    );

    const successfulIds = results
      .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
      .map((r) => r.value);

    setFiles((prev) => prev.filter((f) => !successfulIds.includes(f.id)));

    const errors = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
    if (errors.length > 0) {
      throw new Error(
        `${errors.length} 件のファイルの削除に失敗しました。キャンペーンに使用中の可能性があります。`
      );
    }
  }, []);

  return {
    files,
    setFiles,
    filteredFiles,
    smartTags,
    unassignedCount,
    fileTypeFilter,
    setFileTypeFilter,
    searchQuery,
    setSearchQuery,
    unassignedOnly,
    setUnassignedOnly,
    sizeFilter,
    setSizeFilter,
    dateFilter,
    setDateFilter,
    selectedTag,
    setSelectedTag,
    handleFilesDropped,
    handleRename,
    handleDelete,
    handleBulkDelete,
    refreshFiles: fetchFiles,
    storageStats,
    uploadError,
  };
}
