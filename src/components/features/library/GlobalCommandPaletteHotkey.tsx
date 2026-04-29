"use client";

import { useEffect } from "react";
import { useCommandPaletteStore } from "@/stores/commandPaletteStore";

export function GlobalCommandPaletteHotkey() {
  const requestOpen = useCommandPaletteStore((state) => state.requestOpen);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isCmdOrCtrl = event.metaKey || event.ctrlKey;
      if (!isCmdOrCtrl || event.key.toLowerCase() !== "k") return;
      event.preventDefault();
      requestOpen();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [requestOpen]);

  return null;
}
