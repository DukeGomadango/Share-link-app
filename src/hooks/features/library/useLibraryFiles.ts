"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { AssetFile } from "@/components/features/library/types";
import { MAX_UPLOAD_BYTES } from "@/lib/storage/config";

export function useLibraryFiles() {
  const [files, setFiles] = useState<AssetFile[]>([]);
  const [fileTypeFilter, setFileTypeFilter] = useState<"all" | "image" | "audio">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [sizeFilter, setSizeFilter] = useState<"all" | "small" | "medium" | "large">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "7d" | "30d" | "90d">("all");
  const [selectedTag, setSelectedTag] = useState("all");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [nowTs] = useState(() => Date.now());

  const fetchFiles = useCallback(() => {
    fetch("/api/files")
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((data) => setFiles(data as AssetFile[]))
      .catch((e) => console.error("Failed to fetch files:", e));
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

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
      const err = await init.json().catch(() => ({}));
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
      const err = await reg.json().catch(() => ({}));
      throw new Error(
        typeof err?.error === "string" ? err.error : `register failed: ${reg.status}`
      );
    }
  }, []);

  const handleFilesDropped = async (droppedFiles: File[]) => {
    setUploadError(null);
    const tooLargeFiles = droppedFiles.filter(f => f.size > MAX_UPLOAD_BYTES);
    const validFiles = droppedFiles.filter(f => f.size <= MAX_UPLOAD_BYTES);

    if (tooLargeFiles.length > 0) {
      setUploadError(`${tooLargeFiles.length} 件のファイルが制限（50MB）を超えているためスキップされました。`);
    }

    for (const file of validFiles) {
      try {
        await uploadSingle(file);
      } catch (error) {
        console.error("Upload error:", error);
        setUploadError("アップロード中にエラーが発生しました。");
      }
    }
    fetchFiles();
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
    refreshFiles: fetchFiles,
    uploadError,
    setUploadError,
  };
}
