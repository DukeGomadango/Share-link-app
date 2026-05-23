"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SignOutButton({
  label,
  className,
  variant = "outline",
}: {
  label: string;
  className?: string;
  variant?: "outline" | "ghost";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      disabled={loading}
      onClick={() => void handleSignOut()}
      className={cn("rounded-full gap-2", className)}
    >
      <LogOut className="w-4 h-4" />
      {loading ? "..." : label}
    </Button>
  );
}
