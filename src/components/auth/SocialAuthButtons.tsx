"use client";

import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getAuthCallbackUrl } from "@/lib/auth/callback-url";
import { cn } from "@/lib/utils";

type Provider = "google" | "azure";

/** Microsoft「4 色」ロゴ（サインイン用の一般的な表現。各社公式 SVG の代わりに色面を使用） */
function MicrosoftFourColorMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 21 21"
      aria-hidden
      className={cn("shrink-0", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

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
        onClick={() => void signIn("azure")}
        className={cn(
          "relative h-11 w-full overflow-hidden rounded-full border font-medium shadow-sm",
          "border-zinc-200 bg-white text-zinc-900",
          "hover:bg-zinc-50 hover:shadow hover:text-zinc-900",
          "dark:border-zinc-700 dark:bg-black dark:text-white",
          "dark:hover:bg-zinc-950 dark:hover:text-white",
        )}
      >
        <span
          className="pointer-events-none absolute left-4 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center"
          aria-hidden
        >
          <MicrosoftFourColorMark className="size-5" />
        </span>
        <span className="block w-full px-12 text-center text-sm">
          {loading === "azure" ? t.common.loading : t.auth.login.continueMicrosoft}
        </span>
      </Button>
    </div>
  );
}
