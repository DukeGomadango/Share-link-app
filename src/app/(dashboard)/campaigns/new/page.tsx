"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Megaphone } from "lucide-react";
import Link from "next/link";

export default function NewCampaignPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState("direct");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call and redirect to detail page
    router.push("/campaigns/camp-new");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/campaigns">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Create Campaign</h1>
      </div>

      <GlassCard>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Campaign Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Spring Exclusive Voice Gacha"
              required
              className="w-full px-4 py-3 bg-background/50 border border-border/80 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-shadow"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Distribution Type</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                className={`flex items-start space-x-3 p-4 rounded-xl border cursor-pointer transition-colors ${type === 'direct' ? 'border-emerald-500 bg-emerald-500/10' : 'border-border/50 hover:bg-muted/50'}`}
                onClick={() => setType('direct')}
              >
                <div className="mt-0.5">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${type === 'direct' ? 'border-emerald-500' : 'border-muted-foreground'}`}>
                    {type === 'direct' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Direct Gift (1-to-1)</h4>
                  <p className="text-xs text-muted-foreground mt-1">Assign specific files to individual recipients manually.</p>
                </div>
              </div>
              
              <div 
                className={`flex items-start space-x-3 p-4 rounded-xl border cursor-pointer transition-colors ${type === 'gacha' ? 'border-emerald-500 bg-emerald-500/10' : 'border-border/50 hover:bg-muted/50'}`}
                onClick={() => setType('gacha')}
              >
                <div className="mt-0.5">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${type === 'gacha' ? 'border-emerald-500' : 'border-muted-foreground'}`}>
                    {type === 'gacha' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Gacha (Random)</h4>
                  <p className="text-xs text-muted-foreground mt-1">Recipients receive a random file from the pool.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 flex justify-end space-x-4 border-t border-border/30">
            <Button variant="ghost" asChild className="rounded-full px-6">
              <Link href="/campaigns">Cancel</Link>
            </Button>
            <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 px-8 rounded-full transition-transform hover:-translate-y-0.5">
              <Megaphone className="w-4 h-4 mr-2" />
              Create
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
