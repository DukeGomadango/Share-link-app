import * as React from "react";
import { cn } from "@/lib/utils";

interface BentoItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** グリッド列スパン (例: 1, 2)。重要度の高い指標には大きな値を設定 */
  colSpan?: 1 | 2 | 3;
  /** グリッド行スパン (例: 1, 2)。大きなカードには2を設定 */
  rowSpan?: 1 | 2;
}

export const BentoGrid = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "grid grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto auto-rows-min",
      className
    )}
    {...props}
  />
));
BentoGrid.displayName = "BentoGrid";

export const BentoItem = React.forwardRef<
  HTMLDivElement,
  BentoItemProps
>(({ className, colSpan = 1, rowSpan = 1, ...props }, ref) => {
  const spanClasses = cn(
    colSpan === 2 && "md:col-span-2",
    colSpan === 3 && "md:col-span-3",
    rowSpan === 2 && "md:row-span-2",
  );

  return (
    <div
      ref={ref}
      className={cn(
        "glass glass-text-safe p-6 flex flex-col transition-shadow duration-300 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/20",
        spanClasses,
        className
      )}
      {...props}
    />
  );
});
BentoItem.displayName = "BentoItem";
