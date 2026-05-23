"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type BillingPlanTier = "free" | "pro" | "supporter" | "neutral";

const tierClass: Record<BillingPlanTier, string> = {
  free: "billing-plan-card-free opacity-[0.92]",
  pro: "billing-plan-card-pro",
  supporter: "billing-plan-card-supporter",
  neutral: "",
};

export const BillingGlassCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    tier?: BillingPlanTier;
    /** Pro カード上部のアクセントライン（だんごツールの CounterPanel 風） */
    accentLine?: string;
  }
>(({ className, tier = "neutral", accentLine, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "glass-panel-strong glass-text-safe rounded-2xl border p-6 relative overflow-visible",
      tierClass[tier],
      className
    )}
    {...props}
  >
    {accentLine && (
      <div
        aria-hidden
        className="absolute top-0 left-[8%] right-[8%] h-[2px] opacity-80 rounded-full"
        style={{ background: accentLine }}
      />
    )}
    {children}
  </div>
));
BillingGlassCard.displayName = "BillingGlassCard";

export function BillingGlassScene({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("billing-scene overflow-visible px-0 py-1 sm:px-1", className)}>
      {children}
    </div>
  );
}
