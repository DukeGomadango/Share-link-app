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

  // Form Data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    tags: [] as string[],
    expiresAt: "", // Default empty (smart default handled in UI or effect)
    securityLevel: "standard" as "standard" | "high" | "paranoid",
    useOtp: false,
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    { id: 1, label: t.campaigns.new.steps.step1 },
    { id: 2, label: t.campaigns.new.steps.step2 },
    { id: 3, label: t.campaigns.new.steps.step3 },
  ];

  // Smart Default for Expiry (30 days from now)
  useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setFormData(prev => ({ ...prev, expiresAt: d.toISOString().split("T")[0] }));
  });

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
      router.push(`/campaigns/${campaign.id}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "作成に失敗しました");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/campaigns">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {t.campaigns.new.title}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t.campaigns.new.subtitle}</p>
        </div>
      </div>

      {/* Stepper */}
      <Stepper steps={steps} currentStep={step} className="mb-12" />

      {/* Main Content */}
      <div className="relative">
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <GlassCard className="p-8 md:p-12 overflow-hidden min-h-[400px] flex flex-col">
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

          {/* Step 2: Placeholder for File Addition */}
          {step === 2 && (
            <StepFileSelect t={t} />
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

          {/* Navigation Buttons */}
          <div className="mt-auto pt-10 flex justify-between items-center border-t border-border/30">
            <Button 
              variant="ghost" 
              onClick={step === 1 ? () => router.push("/campaigns") : handlePrev}
              className="rounded-full px-6 hover:bg-muted/50"
              disabled={loading}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              {step === 1 ? t.common.cancel : t.campaigns.new.prevStep}
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={loading || (step === 1 && !formData.name.trim())}
              className={cn(
                "rounded-full px-10 transition-all duration-300 shadow-xl",
                step === totalSteps 
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                  : "bg-foreground text-background hover:opacity-90"
              )}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin mr-2" />
                  {t.common.loading}
                </div>
              ) : (
                <>
                  {step === totalSteps ? (
                    <>
                      <Megaphone className="w-4 h-4 mr-2" />
                      {t.campaigns.new.submit}
                    </>
                  ) : (
                    <>
                      {t.campaigns.new.nextStep}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
