"use client";

import { Gift } from "lucide-react";
import { CountdownBadge } from "@/components/shared/CountdownBadge";

interface ClaimUnopenedViewProps {
  onOpen: () => void;
  expiryDate: Date;
}

export function ClaimUnopenedView({ onOpen, expiryDate }: ClaimUnopenedViewProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-12 animate-in zoom-in-95 duration-700">
      <div className="space-y-5 flex flex-col items-center">
        <CountdownBadge expiresAt={expiryDate} />
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-600">
          You Received a Gift!
        </h1>
        <p className="text-muted-foreground/80 text-sm">From: Spring Voice Gacha 2026</p>
      </div>

      <button
        onClick={onOpen}
        className="relative group focus:outline-none"
      >
        <div className="absolute -inset-6 bg-emerald-500/30 blur-2xl rounded-full group-hover:bg-emerald-500/40 transition duration-700" />
        <div className="relative w-44 h-44 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/50 transform transition-all duration-300 group-hover:scale-105 group-hover:-rotate-3 group-active:scale-95">
          <Gift className="w-20 h-20 text-white" strokeWidth={1.5} />
        </div>
        <p className="mt-8 text-sm font-bold tracking-[0.2em] text-emerald-500 uppercase animate-pulse">
          Tap to Open
        </p>
      </button>
    </div>
  );
}
