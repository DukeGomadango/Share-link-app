"use client";

import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { SiDiscord } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getAuthCallbackUrl } from "@/lib/auth/callback-url";
import { cn } from "@/lib/utils";

type Provider = "google" | "discord";

export function SocialAuthButtons({
  nextPath,
  disabled,
}: {
  nextPath: string;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signIn(provider: Provider) {
    setError(null);
    setLoading(provider);
    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = getAuthCallbackUrl(nextPath);
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: false,
        },
      });
      if (err) {
        throw err;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "OAuth に失敗しました");
      setLoading(null);
    }
  }

  const busy = disabled || loading !== null;

  return (
    <div className="space-y-3">
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="button"
        variant="ghost"
        disabled={busy}
        onClick={() => void signIn("google")}
        className={cn(
          "relative h-11 w-full overflow-hidden rounded-full border font-medium shadow-sm",
          "border-[#dadce0] bg-white text-zinc-900",
          "hover:bg-zinc-50 hover:shadow hover:text-zinc-900",
          "dark:border-zinc-600 dark:bg-zinc-100 dark:text-zinc-900",
          "dark:hover:bg-white",
        )}
      >
        <span
          className="pointer-events-none absolute left-4 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center"
          aria-hidden
        >
          <FcGoogle className="size-5" />
        </span>
        <span className="block w-full px-12 text-center text-sm">
          {loading === "google" ? t.common.loading : t.auth.login.continueGoogle}
        </span>
      </Button>

      <Button
        type="button"
        variant="ghost"
        disabled={busy}
        onClick={() => void signIn("discord")}
        className={cn(
          "relative h-11 w-full overflow-hidden rounded-full border font-medium shadow-sm",
          "border-[#4752C4] bg-[#5865F2] text-white",
          "hover:bg-[#4752C4] hover:shadow hover:text-white",
          "dark:border-[#4752C4] dark:bg-[#5865F2] dark:text-white",
          "dark:hover:bg-[#4752C4] dark:hover:text-white",
        )}
      >
        <span
          className="pointer-events-none absolute left-4 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center text-white"
          aria-hidden
        >
          <SiDiscord className="size-5" />
        </span>
        <span className="block w-full px-12 text-center text-sm">
          {loading === "discord" ? t.common.loading : t.auth.login.continueDiscord}
        </span>
      </Button>
    </div>
  );
}
