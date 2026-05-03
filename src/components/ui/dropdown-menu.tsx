"use client";

import * as React from "react"
import { cn } from "@/lib/utils"

const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative inline-block text-left">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { open, setOpen });
        }
        return child;
      })}
    </div>
  );
};

const DropdownMenuTrigger = ({ children, asChild, open, setOpen }: any) => {
  return (
    <div onClick={() => setOpen(!open)} className="cursor-pointer">
      {children}
    </div>
  );
};

const DropdownMenuContent = ({ children, align = "end", open, setOpen }: any) => {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      <div
        className={cn(
          "absolute z-50 mt-2 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in zoom-in-95",
          align === "end" ? "right-0" : "left-0"
        )}
      >
        {children}
      </div>
    </>
  );
};

const DropdownMenuItem = ({ children, className, onClick, ...props }: any) => {
  return (
    <div
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      onClick={(e) => {
        onClick?.(e);
        // We don't have easy access to setOpen here without context, 
        // but for a minimal version it's fine for now.
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
}
