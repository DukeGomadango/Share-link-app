"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { AssetFile } from "@/components/features/library/types";
import { LIBRARY_FILES_PAGE_SIZE } from "@/lib/assets/library-list-config";
import {
  serializeAssetListFilters,
  type AssetListFilters,
} from "@/lib/assets/library-list-filters";

export type WorkspaceStorageStats = {
  usedBytes: number;
  limitBytes: number;
  planTier: string;
  billingTier?: "pro" | "supporter" | null;
  workspaceId: string;
};

export type WorkspaceAssetCounts = {
  total: number;
  unassigned: number;
};

type FilesApiResponse = {
  files?: AssetFile[];
  stats?: WorkspaceStorageStats;
  counts?: WorkspaceAssetCounts;
  filteredTotal?: number | null;
  page?: {
    hasMore: boolean;
    nextCursor: string | null;
    limit: number;
  };
};

type WorkspaceLibraryContextValue = {
  files: AssetFile[];
  stats: WorkspaceStorageStats | null;
  assetCounts: WorkspaceAssetCounts;
  filteredTotal: number | null;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  setFiles: React.Dispatch<React.SetStateAction<AssetFile[]>>;
  reloadList: (filters: AssetListFilters) => Promise<void>;
  refresh: () => Promise<void>;
  loadMore: () => void;
  ensureAllFilesLoaded: () => Promise<void>;
};

const defaultCounts: WorkspaceAssetCounts = { total: 0, unassigned: 0 };

const WorkspaceLibraryContext = createContext<WorkspaceLibraryContextValue | null>(
  null
);

function mapApiPayload(data: FilesApiResponse): {
  files: AssetFile[];
  stats: WorkspaceStorageStats | null;
  counts: WorkspaceAssetCounts;
  filteredTotal: number | null;
  hasMore: boolean;
  nextCursor: string | null;
} {
  return {
    files: Array.isArray(data.files) ? data.files : [],
    stats: data.stats ?? null,
    counts: data.counts ?? defaultCounts,
    filteredTotal:
      typeof data.filteredTotal === "number" ? data.filteredTotal : null,
    hasMore: data.page?.hasMore ?? false,
    nextCursor: data.page?.nextCursor ?? null,
  };
}

export function WorkspaceLibraryProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<AssetFile[]>([]);
  const [stats, setStats] = useState<WorkspaceStorageStats | null>(null);
  const [assetCounts, setAssetCounts] = useState<WorkspaceAssetCounts>(defaultCounts);
  const [filteredTotal, setFilteredTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextCursorRef = useRef<string | null>(null);
  const filtersRef = useRef<AssetListFilters>({});
  const loadMoreInFlightRef = useRef<Promise<void> | null>(null);
  const reloadInFlightRef = useRef<Promise<void> | null>(null);

  const fetchPage = useCallback(
    async (filters: AssetListFilters, cursor?: string | null) => {
      const params = serializeAssetListFilters(filters);
      params.set("limit", String(LIBRARY_FILES_PAGE_SIZE));
      if (cursor) {
        params.set("cursor", cursor);
      }
      const r = await fetch(`/api/files?${params.toString()}`);
      if (!r.ok) {
        throw new Error(String(r.status));
      }
      const data = (await r.json()) as FilesApiResponse;
      return mapApiPayload(data);
    },
    []
  );

  const reloadList = useCallback(
    async (filters: AssetListFilters) => {
      if (reloadInFlightRef.current) {
        return reloadInFlightRef.current;
      }

      const run = (async () => {
        setLoading(true);
        try {
          filtersRef.current = filters;
          const page = await fetchPage(filters, null);
          setFiles(page.files);
          setStats(page.stats);
          setAssetCounts(page.counts);
          setFilteredTotal(page.filteredTotal);
          setHasMore(page.hasMore);
          nextCursorRef.current = page.nextCursor;
          setError(null);
        } catch (e) {
          console.error("Failed to fetch workspace library:", e);
          setError("load_failed");
        } finally {
          setLoading(false);
          reloadInFlightRef.current = null;
        }
      })();

      reloadInFlightRef.current = run;
      return run;
    },
    [fetchPage]
  );

  const refresh = useCallback(async () => {
    await reloadList(filtersRef.current);
  }, [reloadList]);

  const loadMore = useCallback(async () => {
    const cursor = nextCursorRef.current;
    if (!cursor || loadMoreInFlightRef.current) {
      return loadMoreInFlightRef.current ?? Promise.resolve();
    }

    const run = (async () => {
      setLoadingMore(true);
      try {
        const page = await fetchPage(filtersRef.current, cursor);
        setFiles((prev) => {
          const seen = new Set(prev.map((f) => f.id));
          const appended = page.files.filter((f) => !seen.has(f.id));
          return [...prev, ...appended];
        });
        setStats(page.stats);
        setAssetCounts(page.counts);
        setFilteredTotal(page.filteredTotal);
        setHasMore(page.hasMore);
        nextCursorRef.current = page.nextCursor;
      } catch (e) {
        console.error("Failed to load more library files:", e);
      } finally {
        setLoadingMore(false);
        loadMoreInFlightRef.current = null;
      }
    })();

    loadMoreInFlightRef.current = run;
    return run;
  }, [fetchPage]);

  const ensureAllFilesLoaded = useCallback(async () => {
    let guard = 0;
    while (nextCursorRef.current && guard < 50) {
      guard += 1;
      await loadMore();
    }
  }, [loadMore]);

  const value = useMemo(
    () => ({
      files,
      stats,
      assetCounts,
      filteredTotal,
      loading,
      loadingMore,
      hasMore,
      error,
      setFiles,
      reloadList,
      refresh,
      loadMore: () => void loadMore(),
      ensureAllFilesLoaded,
    }),
    [
      files,
      stats,
      assetCounts,
      filteredTotal,
      loading,
      loadingMore,
      hasMore,
      error,
      reloadList,
      refresh,
      loadMore,
      ensureAllFilesLoaded,
    ]
  );

  return (
    <WorkspaceLibraryContext.Provider value={value}>
      {children}
    </WorkspaceLibraryContext.Provider>
  );
}

export function useWorkspaceLibrary() {
  const ctx = useContext(WorkspaceLibraryContext);
  if (!ctx) {
    throw new Error("useWorkspaceLibrary must be used within WorkspaceLibraryProvider");
  }
  return ctx;
}
