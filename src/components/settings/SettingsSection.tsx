"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SettingsSectionProps = {
  heading: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

/** モバイルではラベル上・カード下に積む設定セクション */
export function SettingsSection({
  heading,
  description,
  children,
  className,
}: SettingsSectionProps) {
  return (
    <section className={cn("grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6", className)}>
      <div className="space-y-1 md:col-span-1">
        <h3 className="text-lg font-semibold">{heading}</h3>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="min-w-0 md:col-span-2">{children}</div>
    </section>
  );
}
