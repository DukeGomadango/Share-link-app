"use client";

import { Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClaimAuthViewProps {
  onVerify: () => void;
}

export function ClaimAuthView({ onVerify }: ClaimAuthViewProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-10 animate-in fade-in duration-1000">
      <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center ring-4 ring-emerald-500/20 shadow-[-0_0_60px_#10B98133]">
        <Fingerprint className="w-10 h-10 text-emerald-500" />
      </div>
      <div className="space-y-3">
        <h1 className="text-2xl font-bold tracking-tight">Secure Content</h1>
        <p className="text-muted-foreground/80 max-w-[250px] mx-auto text-sm leading-relaxed">
          This gift is protected. Please verify your identity to access the contents.
        </p>
      </div>
      <Button
        onClick={onVerify}
        className="rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white px-8 h-14 text-lg backdrop-blur-md shadow-[0_0_20px_oklch(0.645_0.165_158.452/0.2)] border border-emerald-500/50 transition-all hover:scale-105"
      >
        <Fingerprint className="w-5 h-5 mr-3" />
        Verify Identity
      </Button>
    </div>
  );
}
