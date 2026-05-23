"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n";

export function ProfileEmailSection() {
  const { t } = useTranslation();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.auth.getUser();
        if (!cancelled) {
          setEmail(data.user?.email ?? null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{t.settings.profile.emailAddress}</label>
      <input
        type="email"
        readOnly
        className="w-full px-4 py-2 border border-border/80 bg-muted/30 rounded-md text-muted-foreground cursor-default"
        value={loading ? "" : (email ?? "")}
        placeholder={loading ? t.common.loading : "—"}
      />
      <p className="text-xs text-muted-foreground leading-relaxed">
        {t.settings.profile.emailNote}
      </p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {t.settings.profile.emailBillingNote}
      </p>
    </div>
  );
}
