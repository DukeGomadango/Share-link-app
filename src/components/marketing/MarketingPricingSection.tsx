"use client";

import { useState } from "react";
import { BillingPlanColumns } from "@/components/features/billing/BillingPlanColumns";
import { BillingGlassScene } from "@/components/features/billing/BillingGlassCard";
import { BillingIntervalToggle } from "@/components/features/billing/BillingIntervalToggle";
import type { BillingInterval } from "@/components/features/billing/billing-pricing";

export function MarketingPricingSection() {
  const [interval, setInterval] = useState<BillingInterval>("month");

  return (
    <BillingGlassScene className="space-y-6 overflow-visible">
      <div className="flex justify-center pt-1">
        <BillingIntervalToggle interval={interval} onChange={setInterval} />
      </div>
      <BillingPlanColumns interval={interval} mode="marketing" />
    </BillingGlassScene>
  );
}
