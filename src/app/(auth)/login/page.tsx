"use client";

import Link from "next/link";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { Gift } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function LoginPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* 背景のアンビエントグロー */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

      <GlassCard className="w-full max-w-md relative z-10 p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-emerald-500/10 rounded-2xl mb-4">
            <Gift className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t.auth.login.title}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t.auth.login.subtitle}</p>
        </div>

        <form className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t.auth.login.email}</label>
            <input
              type="email"
              className="w-full px-4 py-2 border border-border/80 bg-background/50 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-shadow"
              placeholder="creater@example.com"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-foreground">
                {t.auth.login.password}
              </label>
              <Link
                href="#"
                className="text-xs text-emerald-500 hover:text-emerald-600 transition-colors"
              >
                {t.auth.login.forgotPassword}
              </Link>
            </div>
            <input
              type="password"
              className="w-full px-4 py-2 border border-border/80 bg-background/50 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-shadow"
              placeholder="••••••••"
            />
          </div>
          <div className="pt-2">
            <Button
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 rounded-full"
              asChild
            >
              <Link href="/dashboard">{t.auth.login.signIn}</Link>
            </Button>
          </div>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-8">
          {t.auth.login.noAccount}{" "}
          <Link href="/register" className="text-emerald-500 hover:underline font-medium ml-1">
            {t.auth.login.registerHere}
          </Link>
        </p>
      </GlassCard>
    </div>
  );
}
