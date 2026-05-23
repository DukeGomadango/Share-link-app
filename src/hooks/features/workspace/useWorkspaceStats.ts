"use client";

import { useWorkspaceLibrary } from "@/context/WorkspaceLibraryContext";

export function useWorkspaceStats() {
  const { stats, loading, refresh } = useWorkspaceLibrary();

  return {
    stats,
    loading,
    refreshStats: refresh,
  };
}
