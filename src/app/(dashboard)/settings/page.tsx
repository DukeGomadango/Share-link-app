"use client";

import { GlassCard } from "@/components/shared/GlassCard";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-2">
          <h3 className="font-semibold text-lg">Appearance</h3>
          <p className="text-sm text-muted-foreground">Customize how the platform looks on your device.</p>
        </div>
        <GlassCard className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Theme Preference</h4>
              <p className="text-sm text-muted-foreground mt-1">Choose between Light or Dark mode.</p>
            </div>
            <ThemeToggle />
          </div>
        </GlassCard>
      </div>

      <div className="border-t border-border/50 my-8" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-2">
          <h3 className="font-semibold text-lg">Profile</h3>
          <p className="text-sm text-muted-foreground">Update your creator information.</p>
        </div>
        <GlassCard className="md:col-span-2 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Display Name</label>
              <input 
                type="text" 
                className="w-full px-4 py-2 border border-border/80 bg-background/50 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/50" 
                defaultValue="Creator A"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <input 
                type="email" 
                className="w-full px-4 py-2 border border-border/80 bg-background/50 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/50" 
                defaultValue="creator@example.com"
                disabled
              />
              <p className="text-xs text-muted-foreground">Contact support to change your email address.</p>
            </div>
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full">
              Save Changes
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
