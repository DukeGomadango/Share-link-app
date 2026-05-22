"use client";

import { useState, useEffect, useCallback } from "react";

type WorkspaceStats = {
  usedBytes: number;
  limitBytes: number;
  planTier: string;
  workspaceId: string;
};

export function useWorkspaceStats() {
  const [stats, setStats] = useState<WorkspaceStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const r = await fetch("/api/files");
      if (!r.ok) return;
      const data = (await r.json()) as { stats?: WorkspaceStats };
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (e) {
      console.error("Failed to fetch workspace stats:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const r = await fetch("/api/files");
        if (cancelled || !r.ok) return;
        const data = (await r.json()) as { stats?: WorkspaceStats };
        if (data.stats) {
          setStats(data.stats);
        }
      } catch (e) {
        console.error("Failed to fetch workspace stats:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { stats, loading, refreshStats: fetchStats };
}
