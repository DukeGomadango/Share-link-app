"use client";

import { useEffect, useState } from "react";

const LG_QUERY = "(min-width: 1024px)";

/** Tailwind `lg` 以上（デスクトップダッシュボードレイアウト） */
export function useIsLgUp() {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(LG_QUERY);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return matches;
}
