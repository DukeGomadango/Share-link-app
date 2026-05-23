"use client";

import Link from "next/link";
import { GlassCard } from "@/components/shared/GlassCard";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { useTranslation } from "@/lib/i18n";

export default function SettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t.settings.title}</h1>
        <p className="text-muted-foreground mt-1">{t.settings.subtitle}</p>
      </div>

      {/* 外観 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-2">
          <h3 className="font-semibold text-lg">{t.settings.appearance.heading}</h3>
          <p className="text-sm text-muted-foreground">{t.settings.appearance.description}</p>
        </div>
        <GlassCard className="md:col-span-2 space-y-6">
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
      </div>

      <div className="border-t border-border/50 my-8" />

      {/* 言語 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-2">
          <h3 className="font-semibold text-lg">{t.settings.language.heading}</h3>
          <p className="text-sm text-muted-foreground">{t.settings.language.description}</p>
        </div>
        <GlassCard className="md:col-span-2 space-y-6">
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
      </div>

      <div className="border-t border-border/50 my-8" />

      {/* 外部連携 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-2">
          <h3 className="font-semibold text-lg">{t.settings.integrationsLink.heading}</h3>
          <p className="text-sm text-muted-foreground">{t.settings.integrationsLink.description}</p>
        </div>
        <GlassCard className="md:col-span-2 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">{t.integrations.subtitle}</p>
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shrink-0" asChild>
            <Link href="/settings/integrations">{t.settings.integrationsLink.open}</Link>
          </Button>
        </GlassCard>
      </div>

      <div className="border-t border-border/50 my-8" />

      {/* アカウント */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-2">
          <h3 className="font-semibold text-lg">{t.settings.account.heading}</h3>
          <p className="text-sm text-muted-foreground">{t.settings.account.description}</p>
        </div>
        <GlassCard className="md:col-span-2 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">{t.settings.account.signOutHint}</p>
          <SignOutButton label={t.settings.account.signOut} />
        </GlassCard>
      </div>

      <div className="border-t border-border/50 my-8" />

      {/* プロフィール */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-2">
          <h3 className="font-semibold text-lg">{t.settings.profile.heading}</h3>
          <p className="text-sm text-muted-foreground">{t.settings.profile.description}</p>
        </div>
        <GlassCard className="md:col-span-2 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.settings.profile.displayName}</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-border/80 bg-background/50 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                defaultValue="Creator A"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.settings.profile.emailAddress}</label>
              <input
                type="email"
                className="w-full px-4 py-2 border border-border/80 bg-background/50 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                defaultValue="creator@example.com"
                disabled
              />
              <p className="text-xs text-muted-foreground">{t.settings.profile.emailNote}</p>
            </div>
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full">
              {t.settings.profile.saveChanges}
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
