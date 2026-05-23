export type SignedUrlPurpose = "preview" | "view";

const CACHE_TTL_MS = 50 * 60 * 1000;
const BATCH_DEBOUNCE_MS = 16;
const MAX_BATCH_SIZE = 40;

type CacheEntry = {
  url: string;
  expiresAt: number;
};

type Listener = (url: string | null) => void;

const cache = new Map<string, CacheEntry>();
const listeners = new Map<string, Set<Listener>>();
const pendingByPurpose = new Map<SignedUrlPurpose, Set<string>>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushInFlight: Promise<void> | null = null;

function cacheKey(fileId: string, purpose: SignedUrlPurpose): string {
  return `${purpose}:${fileId}`;
}

function getCached(fileId: string, purpose: SignedUrlPurpose): string | null {
  const entry = cache.get(cacheKey(fileId, purpose));
  if (!entry) return null;
  if (Date.now() >= entry.expiresAt) {
    cache.delete(cacheKey(fileId, purpose));
    return null;
  }
  return entry.url;
}

function notify(fileId: string, purpose: SignedUrlPurpose, url: string | null) {
  const key = cacheKey(fileId, purpose);
  const subs = listeners.get(key);
  if (!subs) return;
  for (const fn of subs) {
    fn(url);
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushPending();
  }, BATCH_DEBOUNCE_MS);
}

async function flushPending() {
  if (flushInFlight) {
    await flushInFlight;
    if (pendingByPurpose.size > 0) {
      return flushPending();
    }
    return;
  }

  const snapshot = new Map(pendingByPurpose);
  pendingByPurpose.clear();

  if (snapshot.size === 0) return;

  flushInFlight = (async () => {
    for (const [purpose, ids] of snapshot) {
      const fileIds = [...ids].slice(0, MAX_BATCH_SIZE);
      if (fileIds.length === 0) continue;

      try {
        const r = await fetch("/api/files/signed-urls", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileIds, purpose }),
        });
        if (!r.ok) {
          for (const id of fileIds) {
            notify(id, purpose, null);
          }
          continue;
        }
        const data = (await r.json()) as {
          urls?: Record<string, string>;
          expiresInSeconds?: number;
        };
        const ttl =
          typeof data.expiresInSeconds === "number"
            ? data.expiresInSeconds * 1000
            : CACHE_TTL_MS;
        const expiresAt = Date.now() + Math.min(ttl, CACHE_TTL_MS);

        for (const id of fileIds) {
          const url = data.urls?.[id] ?? null;
          if (url) {
            cache.set(cacheKey(id, purpose), { url, expiresAt });
          }
          notify(id, purpose, url);
        }
      } catch {
        for (const id of fileIds) {
          notify(id, purpose, null);
        }
      }
    }
  })();

  try {
    await flushInFlight;
  } finally {
    flushInFlight = null;
  }

  if (pendingByPurpose.size > 0) {
    scheduleFlush();
  }
}

export function subscribeSignedUrl(
  fileId: string,
  purpose: SignedUrlPurpose,
  listener: Listener
): () => void {
  const key = cacheKey(fileId, purpose);
  const cached = getCached(fileId, purpose);
  if (cached) {
    listener(cached);
  } else {
    listener(null);
    let pending = pendingByPurpose.get(purpose);
    if (!pending) {
      pending = new Set();
      pendingByPurpose.set(purpose, pending);
    }
    pending.add(fileId);
    scheduleFlush();
  }

  let subs = listeners.get(key);
  if (!subs) {
    subs = new Set();
    listeners.set(key, subs);
  }
  subs.add(listener);

  return () => {
    subs?.delete(listener);
    if (subs && subs.size === 0) {
      listeners.delete(key);
    }
  };
}

export function invalidateSignedUrlCache(fileId?: string) {
  if (!fileId) {
    cache.clear();
    return;
  }
  for (const purpose of ["preview", "view"] as const) {
    cache.delete(cacheKey(fileId, purpose));
  }
}
