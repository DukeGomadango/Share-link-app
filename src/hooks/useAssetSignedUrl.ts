"use client";

import { useEffect, useState } from "react";

type Purpose = "preview" | "view";

export function useAssetSignedUrl(
  fileId: string | undefined,
  enabled: boolean,
  purpose: Purpose = "preview"
) {
  const active = enabled && !!fileId;
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  useEffect(() => {
    if (!active || !fileId) {
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
      }
    });

    fetch(`/api/files/${fileId}/signed-url?purpose=${purpose}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(String(res.status));
        }
        return res.json() as Promise<{ url?: string }>;
      })
      .then((data) => {
        if (!cancelled) {
          setUrl(data.url ?? null);
          setLoadedFor(fileId);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUrl(null);
          setLoadedFor(fileId);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [active, fileId, purpose]);

  const resolvedUrl =
    active && loadedFor === fileId ? url : null;

  return { url: resolvedUrl, loading: active && loading };
}
