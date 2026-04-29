import * as React from "react";
import { cn } from "@/lib/utils";

export const GlassCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("glass glass-text-safe p-6", className)}
    {...props}
  />
));
GlassCard.displayName = "GlassCard";
