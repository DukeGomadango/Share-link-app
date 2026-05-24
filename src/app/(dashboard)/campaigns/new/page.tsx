"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Megaphone, 
  ChevronRight, 
  ChevronLeft, 
} from "lucide-react";

import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/ui/stepper";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import { StepBasicInfo } from "@/components/features/campaigns/creation/StepBasicInfo";
import { StepFileSelect } from "@/components/features/campaigns/creation/StepFileSelect";
import { StepSecurity } from "@/components/features/campaigns/creation/StepSecurity";

export default function NewCampaignPage() {
  const router = useRouter();
  const { t } = useTranslation();
  
  // Step logic
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const defaultExpiresAt = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  };

  // Form Data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    tags: [] as string[],
    expiresAt: defaultExpiresAt(),
    securityLevel: "standard" as "standard" | "high",
    assetIds: [] as string[],
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    { id: 1, label: t.campaigns.new.steps.step1 },
    { id: 2, label: t.campaigns.new.steps.step2 },
    { id: 3, label: t.campaigns.new.steps.step3 },
  ];

  const handleNext = () => {
    if (step === 1 && !formData.name.trim()) return;
    if (step < totalSteps) setStep(step + 1);
    else handleSubmit();
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const updateFormData = (data: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "作成に失敗しました");
      }
      const campaign = await res.json();
      router.push(`/campaigns/${campaign.id}?tab=files`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "作成に失敗しました");
      setLoading(false);
    }
  }

  const navButtons = (
    <>
      <Button
        variant="ghost"
        onClick={step === 1 ? () => router.push("/campaigns") : handlePrev}
        className="min-h-11 flex-1 rounded-full px-4 hover:bg-muted/50 sm:flex-none sm:px-6"
        disabled={loading}
      >
        <ChevronLeft className="mr-2 size-4" />
        {step === 1 ? t.common.cancel : t.campaigns.new.prevStep}
      </Button>
      <Button
        onClick={handleNext}
        disabled={loading || (step === 1 && !formData.name.trim())}
        size="touch"
        className={cn(
          "min-h-11 flex-1 rounded-full px-6 shadow-xl sm:flex-none sm:px-10",
          step === totalSteps
            ? "bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600"
            : "bg-foreground text-background hover:opacity-90"
        )}
      >
        {loading ? (
          <div className="flex items-center">
            <div className="mr-2 size-4 animate-spin rounded-full border-2 border-background/30 border-t-background" />
            {t.common.loading}
          </div>
        ) : step === totalSteps ? (
          <>
            <Megaphone className="mr-2 size-4" />
            {t.campaigns.new.submit}
          </>
        ) : (
          <>
            {t.campaigns.new.nextStep}
            <ChevronRight className="ml-2 size-4" />
          </>
        )}
      </Button>
    </>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-32 md:space-y-10 md:pb-20">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="shrink-0 rounded-full">
          <Link href="/campaigns">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight md:text-4xl md:bg-gradient-to-r md:from-foreground md:to-foreground/70 md:bg-clip-text md:text-transparent">
            {t.campaigns.new.title}
          </h1>
          <p className="mt-1 hidden text-sm text-muted-foreground sm:block">{t.campaigns.new.subtitle}</p>
        </div>
      </div>

      <Stepper steps={steps} currentStep={step} className="mb-6 md:mb-12" />

      {/* Main Content */}
      <div className="relative">
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <GlassCard className="flex min-h-[320px] flex-col overflow-hidden p-5 md:min-h-[400px] md:p-12">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <StepBasicInfo 
              name={formData.name} 
              description={formData.description} 
              tags={formData.tags} 
              onUpdate={updateFormData} 
              t={t} 
            />
          )}

          {/* Step 2: File Addition */}
          {step === 2 && (
            <StepFileSelect 
              assetIds={formData.assetIds}
              onUpdate={updateFormData}
              t={t} 
            />
          )}

          {/* Step 3: Security & Sharing */}
          {step === 3 && (
            <StepSecurity 
              expiresAt={formData.expiresAt} 
              securityLevel={formData.securityLevel} 
              onUpdate={updateFormData} 
              t={t} 
            />
          )}

          <div className="mt-auto hidden items-center justify-between border-t border-border/30 pt-10 md:flex">
            {navButtons}
          </div>
        </GlassCard>
      </div>

      <div
        className="fixed-bottom-safe fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-40 flex gap-2 border-t border-border/50 bg-background/95 px-3 py-3 backdrop-blur-md md:hidden"
        role="navigation"
        aria-label={t.campaigns.new.title}
      >
        {navButtons}
      </div>
    </div>
  );
}
