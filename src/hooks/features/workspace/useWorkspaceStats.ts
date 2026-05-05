"use client";

import { useState, useEffect } from "react";

export function useWorkspaceStats() {
  const [stats, setStats] = useState<{
    usedBytes: number;
    limitBytes: number;
    planTier: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const r = await fetch("/api/files");
      if (!r.ok) return;
      const data = await r.json();
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (e) {
      console.error("Failed to fetch workspace stats:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // ここでリアルタイム更新が必要ならイベントリスナーなどを追加可能
  }, []);

  return { stats, loading, refreshStats: fetchStats };
}
