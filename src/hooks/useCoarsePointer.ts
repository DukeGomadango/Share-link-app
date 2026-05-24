"use client";

import { useEffect, useState } from "react";

const COARSE_QUERY = "(pointer: coarse)";
const NARROW_QUERY = "(max-width: 1023px)";

/** タッチ主体またはダッシュボード狭幅レイアウト */
export function useCoarsePointer() {
  const [coarse, setCoarse] = useState(false);

  useEffect(() => {
    const coarseMq = window.matchMedia(COARSE_QUERY);
    const narrowMq = window.matchMedia(NARROW_QUERY);

    const update = () => {
      setCoarse(coarseMq.matches || narrowMq.matches);
    };

    update();
    coarseMq.addEventListener("change", update);
    narrowMq.addEventListener("change", update);
    return () => {
      coarseMq.removeEventListener("change", update);
      narrowMq.removeEventListener("change", update);
    };
  }, []);

  return coarse;
}
