"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Megaphone, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/GlassCard";

interface Campaign {
  id: string;
  name: string;
  status: "active" | "draft" | "completed";
  type: string;
  createdAt: string;
  stats: {
    totalFiles: number;
    assignedRecipients: number;
    openRate: number;
  };
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((data) => setCampaigns(data))
      .catch((e) => console.error("Failed to fetch campaigns:", e));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground mt-1">Manage your digital distributions.</p>
        </div>
        <Button asChild className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-6 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105">
          <Link href="/campaigns/new">
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </Link>
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
            <Megaphone className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No campaigns yet</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Create your first campaign to start distributing secure digital contents to your fans.
          </p>
          <Button asChild className="bg-emerald-500">
            <Link href="/campaigns/new">Create Campaign</Link>
          </Button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <GlassCard key={campaign.id} className="relative group hover:border-emerald-500/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-md ${campaign.status === 'active' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg line-clamp-1">{campaign.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {new Date(campaign.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Files</p>
                  <p className="font-semibold">{campaign.stats.totalFiles}</p>
                </div>
                <div className="text-center border-x border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Assigned</p>
                  <p className="font-semibold">{campaign.stats.assignedRecipients}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Open Rate</p>
                  <p className="font-semibold">{campaign.stats.openRate}%</p>
                </div>
              </div>

              <Button asChild variant="outline" className="w-full glass group-hover:bg-emerald-500 group-hover:text-white transition-colors border-border/50">
                <Link href={`/campaigns/${campaign.id}`}>Manage</Link>
              </Button>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
