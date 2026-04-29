"use client";

import { useEffect } from "react";
import type { CommandPaletteSource } from "@/stores/commandPaletteStore";
import { useCommandPaletteStore } from "@/stores/commandPaletteStore";

export function useRegisterCommandPaletteSource(source: CommandPaletteSource) {
  const setSource = useCommandPaletteStore((state) => state.setSource);

  useEffect(() => {
    setSource(source);
    return () => setSource(null);
  }, [setSource, source]);
}
