"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import {
  BillingPlanPicker,
  type BillingInterval,
  type CheckoutTier,
} from "@/components/features/billing/BillingPlanPicker";
import { GlassCard } from "@/components/shared/GlassCard";
import { useTranslation } from "@/lib/i18n";

export default function BillingSettingsPage() {
  return (
    <Suspense fallback={<BillingPageFallback />}>
      <BillingSettingsContent />
    </Suspense>
  );
}

function BillingPageFallback() {
  const { t } = useTranslation();
  return (
    <p className="text-sm text-muted-foreground p-6">{t.common.loading}</p>
  );
}

type BillingStatus = {
  configured: boolean;
  planTier: string;
  billingTier: string | null;
  hasSubscription: boolean;
  hasCustomer: boolean;
  subscriptionCurrentPeriodEnd: string | null;
};

function BillingSettingsContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  async function refreshStatus() {
    const r = await fetch("/api/billing/status");
    if (!r.ok) {
      setLoadError(true);
      return;
    }
    setStatus((await r.json()) as BillingStatus);
    setLoadError(false);
  }

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      toast.success(t.billing.checkoutSuccess);
    } else if (checkout === "cancel") {
      toast.message(t.billing.checkoutCancel);
    }

    let cancelled = false;
    void (async () => {
      setLoadError(false);
      try {
        if (cancelled) return;
        await refreshStatus();
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    searchParams,
    t.billing.checkoutCancel,
    t.billing.checkoutSuccess,
  ]);

  async function startCheckout(tier: CheckoutTier, interval: BillingInterval) {
    const key = `${tier}-${interval}`;
    setPending(key);
    try {
      const r = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, interval }),
      });
      const data = (await r.json()) as { url?: string; message?: string };
      if (!r.ok || !data.url) {
        toast.error(data.message ?? t.billing.checkoutError);
        return;
      }
      window.location.href = data.url;
    } catch {
      toast.error(t.billing.checkoutError);
    } finally {
      setPending(null);
    }
  }

  async function openPortal() {
    setPending("portal");
    try {
      const r = await fetch("/api/billing/portal", { method: "POST" });
      const data = (await r.json()) as { url?: string; message?: string };
      if (!r.ok || !data.url) {
        toast.error(data.message ?? t.billing.portalError);
        return;
      }
      window.location.href = data.url;
    } catch {
      toast.error(t.billing.portalError);
    } finally {
      setPending(null);
    }
  }

  async function switchToSupporter(interval: BillingInterval) {
    setPending(`switch-${interval}`);
    try {
      const r = await fetch("/api/billing/switch-tier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });
      const data = (await r.json()) as { message?: string };
      if (!r.ok) {
        toast.error(data.message ?? t.billing.switchTierError);
        return;
      }
      toast.success(t.billing.switchTierSuccess);
      setLoading(true);
      await refreshStatus();
    } catch {
      toast.error(t.billing.switchTierError);
    } finally {
      setPending(null);
      setLoading(false);
    }
  }

  const isPro = status?.planTier === "pro";
  const isSupporter = status?.billingTier === "supporter";

  return (
    <div className="billing-page space-y-6 max-w-5xl mx-auto overflow-visible">
      <div>
        <Link
          href="/settings"
          className="text-sm text-muted-foreground hover:text-emerald-600"
        >
          ← {t.settings.title}
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mt-2">{t.billing.title}</h1>
        <p className="text-muted-foreground mt-1">{t.billing.subtitle}</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">{t.common.loading}</p>
      ) : loadError ? (
        <GlassCard>
          <p className="text-sm text-muted-foreground">{t.billing.loadError}</p>
        </GlassCard>
      ) : !status?.configured ? (
        <GlassCard>
          <p className="text-sm text-muted-foreground">{t.billing.notConfigured}</p>
        </GlassCard>
      ) : (
        <BillingPlanPicker
          isPro={isPro}
          isSupporter={isSupporter}
          hasCustomer={status.hasCustomer}
          subscriptionCurrentPeriodEnd={status.subscriptionCurrentPeriodEnd}
          pending={pending}
          onCheckout={(tier, interval) => void startCheckout(tier, interval)}
          onOpenPortal={() => void openPortal()}
          onSwitchToSupporter={(interval) => void switchToSupporter(interval)}
        />
      )}
    </div>
  );
}
