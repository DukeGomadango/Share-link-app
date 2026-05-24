"use client";

import Link from "next/link";
import { GlassCard } from "@/components/shared/GlassCard";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { ProfileEmailSection } from "@/components/settings/ProfileEmailSection";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { useTranslation } from "@/lib/i18n";

export default function SettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t.settings.title}</h1>
        <p className="mt-1 text-muted-foreground">{t.settings.subtitle}</p>
      </div>

      <SettingsSection
        heading={t.settings.appearance.heading}
        description={t.settings.appearance.description}
      >
        <GlassCard className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">{t.settings.appearance.themePreference}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {t.settings.appearance.themeDescription}
              </p>
            </div>
            <ThemeToggle />
          </div>
        </GlassCard>
      </SettingsSection>

      <SettingsSection
        heading={t.settings.language.heading}
        description={t.settings.language.description}
      >
        <GlassCard className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">{t.settings.language.label}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {t.settings.language.langDescription}
              </p>
            </div>
            <LanguageToggle />
          </div>
        </GlassCard>
      </SettingsSection>

      <SettingsSection
        heading={t.settings.billingLink.heading}
        description={t.settings.billingLink.description}
      >
        <GlassCard className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
          <p className="text-sm text-muted-foreground">{t.billing.subtitle}</p>
          <Button className="min-h-11 w-full shrink-0 bg-emerald-500 text-white hover:bg-emerald-600 sm:w-auto sm:rounded-full" asChild>
            <Link href="/settings/billing">{t.settings.billingLink.open}</Link>
          </Button>
        </GlassCard>
      </SettingsSection>

      <SettingsSection
        heading={t.settings.integrationsLink.heading}
        description={t.settings.integrationsLink.description}
      >
        <GlassCard className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
          <p className="text-sm text-muted-foreground">{t.integrations.subtitle}</p>
          <Button className="min-h-11 w-full shrink-0 bg-emerald-500 text-white hover:bg-emerald-600 sm:w-auto sm:rounded-full" asChild>
            <Link href="/settings/integrations">{t.settings.integrationsLink.open}</Link>
          </Button>
        </GlassCard>
      </SettingsSection>

      <SettingsSection
        heading={t.settings.account.heading}
        description={t.settings.account.description}
      >
        <GlassCard className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
          <p className="text-sm text-muted-foreground">{t.settings.account.signOutHint}</p>
          <SignOutButton label={t.settings.account.signOut} className="min-h-11 w-full sm:w-auto" />
        </GlassCard>
      </SettingsSection>

      <SettingsSection
        heading={t.settings.profile.heading}
        description={t.settings.profile.description}
      >
        <GlassCard className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.settings.profile.displayName}</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-border/80 bg-background/50 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                defaultValue="Creator A"
              />
            </div>
            <ProfileEmailSection />
            <Button className="min-h-11 w-full bg-emerald-500 text-white hover:bg-emerald-600 sm:w-auto sm:rounded-full">
              {t.settings.profile.saveChanges}
            </Button>
          </div>
        </GlassCard>
      </SettingsSection>
    </div>
  );
}
