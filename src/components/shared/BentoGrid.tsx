import * as React from "react";
import { cn } from "@/lib/utils";

export const BentoGrid = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "grid grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto",
      className
    )}
    {...props}
  />
));
BentoGrid.displayName = "BentoGrid";

export const BentoItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("glass p-6 flex flex-col", className)}
    {...props}
  />
));
BentoItem.displayName = "BentoItem";
