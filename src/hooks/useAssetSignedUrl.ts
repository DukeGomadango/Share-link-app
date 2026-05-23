"use client";

import { useEffect, useState } from "react";

import {
  subscribeSignedUrl,
  type SignedUrlPurpose,
} from "@/lib/assets/signed-url-batch-client";
import { useInView } from "@/hooks/useInView";

type Purpose = SignedUrlPurpose;

type UseAssetSignedUrlOptions = {
  /** true のときビューポート進入後に署名 URL を要求 */
  lazy?: boolean;
};

export function useAssetSignedUrl(
  fileId: string | undefined,
  enabled: boolean,
  purpose: Purpose = "preview",
  options?: UseAssetSignedUrlOptions
) {
  const lazy = options?.lazy ?? false;
  const { ref: inViewRef, inView } = useInView({ enabled: lazy && enabled && !!fileId });
  const active = enabled && !!fileId && (!lazy || inView);

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

    const unsubscribe = subscribeSignedUrl(fileId, purpose, (nextUrl) => {
      if (cancelled) return;
      setUrl(nextUrl);
      setLoadedFor(fileId);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [active, fileId, purpose]);

  const resolvedUrl = active && loadedFor === fileId ? url : null;

  return {
    url: resolvedUrl,
    loading: active && loading && !resolvedUrl,
    inViewRef: lazy ? inViewRef : undefined,
  };
}
