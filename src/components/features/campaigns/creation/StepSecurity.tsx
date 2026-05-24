"use client";

import { ShieldCheck, Clock, Info } from "lucide-react";
import { cn } from "@/lib/utils";

import type { TranslationKeys } from "@/lib/i18n/locales/ja";

interface StepSecurityProps {
  expiresAt: string;
  securityLevel: "standard" | "high";
  onUpdate: (data: Partial<{ expiresAt: string; securityLevel: "standard" | "high" }>) => void;
  t: TranslationKeys;
}

export function StepSecurity({ expiresAt, securityLevel, onUpdate, t }: StepSecurityProps) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center space-x-2 text-emerald-500 mb-2">
        <ShieldCheck className="w-5 h-5" />
        <h2 className="text-xl font-semibold">{t.campaigns.new.steps.step3}</h2>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-emerald-500" />
            <label className="text-sm font-semibold">{t.campaigns.new.expiryLabel}</label>
          </div>
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => onUpdate({ expiresAt: e.target.value })}
            className="min-h-11 w-full rounded-2xl border border-border/50 bg-background/30 px-5 py-4 text-base shadow-sm transition-all focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
          />
          <div className="flex items-start space-x-2 p-3 rounded-xl bg-blue-500/5 text-blue-600 text-[10px] leading-relaxed border border-blue-500/10">
            <Info className="w-3 h-3 mt-0.5 shrink-0" />
            <p>{t.campaigns.new.expiryDescription}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <label className="text-sm font-semibold">{t.campaigns.new.securityLabel}</label>
          </div>
          <div className="space-y-3">
            {(["standard", "high"] as const).map(level => (
              <label 
                key={level}
                className={cn(
                  "flex min-h-[3.25rem] cursor-pointer items-center justify-between rounded-2xl border-2 p-4 transition-all hover:bg-emerald-500/5 md:min-h-0 md:p-5",
                  securityLevel === level 
                    ? "border-emerald-500 bg-emerald-500/10 shadow-md ring-4 ring-emerald-500/5" 
                    : "border-border/30 bg-background/20"
                )}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="securityLevel"
                    className="hidden"
                    checked={securityLevel === level}
                    onChange={() => onUpdate({ securityLevel: level })}
                  />
                  <span className={cn("text-sm font-medium", securityLevel === level ? "text-emerald-700" : "text-foreground/70")}>
                    {t.campaigns.new.securityOptions[level]}
                  </span>
                </div>
                {securityLevel === level && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
              </label>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground ml-1">
            {t.campaigns.new.securityDescription}
          </p>
        </div>
      </div>
    </div>
  );
}
