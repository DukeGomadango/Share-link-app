"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { AssetFile } from "@/components/features/library/types";

export function useLibraryFiles() {
  const [files, setFiles] = useState<AssetFile[]>([]);
  const [fileTypeFilter, setFileTypeFilter] = useState<"all" | "image" | "audio">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [sizeFilter, setSizeFilter] = useState<"all" | "small" | "medium" | "large">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "7d" | "30d" | "90d">("all");
  const [selectedTag, setSelectedTag] = useState("all");
  const [nowTs] = useState(() => Date.now());

  const fetchFiles = useCallback(() => {
    fetch("/api/files")
      .then((r) => r.json())
      .then((data) => setFiles(data))
      .catch((e) => console.error("Failed to fetch files:", e));
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleFilesDropped = async (droppedFiles: File[]) => {
    console.log("Files ready to upload:", droppedFiles);
    try {
      const res = await fetch("/api/files", { method: "POST" });
      if (res.ok) {
        fetchFiles();
      }
    } catch (error) {
      console.error("Upload error:", error);
    }
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
        if (sizeFilter === "medium" && (file.size < 1024 * 1024 || file.size >= 10 * 1024 * 1024)) return false;
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
  }, [files, fileTypeFilter, unassignedOnly, sizeFilter, dateFilter, selectedTag, searchQuery, inferSmartTags, nowTs]);

  const unassignedCount = useMemo(
    () => files.filter((file) => file.linkedCampaigns.length === 0).length,
    [files]
  );

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
  };
}
