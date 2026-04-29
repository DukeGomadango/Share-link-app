"use client";

import { useEffect } from "react";

const ACTIVE_CLASS = "scrollbar-active";

export function GlobalScrollbarActivity() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const markActive = () => {
      document.body.classList.add(ACTIVE_CLASS);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        document.body.classList.remove(ACTIVE_CLASS);
        timer = null;
      }, 700);
    };

    window.addEventListener("scroll", markActive, { passive: true, capture: true });
    window.addEventListener("wheel", markActive, { passive: true });
    window.addEventListener("touchmove", markActive, { passive: true });

    return () => {
      window.removeEventListener("scroll", markActive, true);
      window.removeEventListener("wheel", markActive);
      window.removeEventListener("touchmove", markActive);
      if (timer) clearTimeout(timer);
      document.body.classList.remove(ACTIVE_CLASS);
    };
  }, []);

  return null;
}
