"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Megaphone, 
  ChevronRight, 
  ChevronLeft, 
  Plus, 
  ShieldCheck, 
  Clock, 
  Settings2,
  Tag,
  Info
} from "lucide-react";

import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/ui/stepper";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tagInput, setTagInput] = useState("");

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

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
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
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-emerald-500 mb-2">
                  <Megaphone className="w-5 h-5" />
                  <h2 className="text-xl font-semibold">{t.campaigns.new.steps.step1}</h2>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/80 ml-1">
                    {t.campaigns.new.nameLabel} <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={t.campaigns.searchPlaceholder}
                    className="w-full px-5 py-4 bg-background/30 border border-border/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all text-lg shadow-sm"
                  />
                </div>
              </div>

              {/* Progressive Disclosure: Advanced Settings */}
              <div className="space-y-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="px-2 h-auto hover:bg-transparent text-muted-foreground hover:text-foreground group"
                >
                  <Settings2 className={cn("w-4 h-4 mr-2 transition-transform duration-300", showAdvanced && "rotate-90")} />
                  {t.campaigns.new.advancedSettings}
                </Button>

                {showAdvanced && (
                  <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 origin-top">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground/80 ml-1">
                        {t.campaigns.new.descriptionLabel}
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder={t.campaigns.new.descriptionPlaceholder}
                        rows={3}
                        className="w-full px-5 py-4 bg-background/30 border border-border/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all resize-none shadow-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground/80 ml-1">
                        {t.campaigns.new.tagsLabel}
                      </label>
                      <div className="relative group">
                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                          placeholder={t.campaigns.new.tagsPlaceholder}
                          className="w-full pl-11 pr-5 py-3 bg-background/30 border border-border/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {formData.tags.map(tag => (
                          <span key={tag} className="flex items-center pl-3 pr-1 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-xs font-semibold border border-emerald-500/20 animate-in zoom-in duration-200">
                            {tag}
                            <button 
                              onClick={() => removeTag(tag)} 
                              className="ml-1 p-1 hover:bg-emerald-500/20 rounded-full transition-colors group/tag"
                              aria-label={`Remove ${tag}`}
                            >
                              <Plus className="w-3.5 h-3.5 rotate-45 text-emerald-600/70 group-hover/tag:text-emerald-600" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Placeholder for File Addition */}
          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center space-x-2 text-emerald-500 mb-2">
                <Plus className="w-5 h-5" />
                <h2 className="text-xl font-semibold">{t.campaigns.new.steps.step2}</h2>
              </div>
              
              <div className="flex-1 flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-border/50 rounded-3xl bg-muted/5">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                  <Plus className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground max-w-xs">
                  現在は作成後に詳細画面からファイルを追加できます。<br/>
                  (将来的にここでライブラリ選択が可能になります)
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Security & Sharing */}
          {step === 3 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center space-x-2 text-emerald-500 mb-2">
                <ShieldCheck className="w-5 h-5" />
                <h2 className="text-xl font-semibold">{t.campaigns.new.steps.step3}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    <label className="text-sm font-semibold">{t.campaigns.new.expiryLabel}</label>
                  </div>
                  <input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                    className="w-full px-5 py-4 bg-background/30 border border-border/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
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
                    {(["standard", "high", "paranoid"] as const).map(level => (
                      <label 
                        key={level}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all hover:bg-emerald-500/5",
                          formData.securityLevel === level 
                            ? "border-emerald-500 bg-emerald-500/10 shadow-md ring-4 ring-emerald-500/5" 
                            : "border-border/30 bg-background/20"
                        )}
                      >
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="securityLevel"
                            className="hidden"
                            checked={formData.securityLevel === level}
                            onChange={() => setFormData(prev => ({ ...prev, securityLevel: level }))}
                          />
                          <span className={cn("text-sm font-medium", formData.securityLevel === level ? "text-emerald-700" : "text-foreground/70")}>
                            {t.campaigns.new.securityOptions[level]}
                          </span>
                        </div>
                        {formData.securityLevel === level && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                      </label>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground ml-1">
                    {t.campaigns.new.securityDescription}
                  </p>
                </div>
              </div>
            </div>
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
