"use client";

import { useEffect, useRef, useState } from "react";

type UseInViewOptions = {
  rootMargin?: string;
  threshold?: number;
  /** false のときは常に inView 扱い（遅延無効） */
  enabled?: boolean;
};

export function useInView(options: UseInViewOptions = {}) {
  const { rootMargin = "200px", threshold = 0, enabled = true } = options;
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(!enabled);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled, rootMargin, threshold]);

  return { ref, inView: !enabled || inView };
}
