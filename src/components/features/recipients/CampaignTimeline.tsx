"use client";

import { CheckCircle2, Clock, XCircle, Copy, ExternalLink, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TimelineItem {
  id: string;
  campaignName: string;
  fileName: string;
  status: "opened" | "unopened" | "expired";
  date: string;
  token: string;
}

interface CampaignTimelineProps {
  items: TimelineItem[];
}

export function CampaignTimeline({ items }: CampaignTimelineProps) {
  const getStatusIcon = (status: TimelineItem["status"]) => {
    switch (status) {
      case "opened": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "expired": return <XCircle className="w-4 h-4 text-destructive" />;
      default: return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  const getStatusLabel = (status: TimelineItem["status"]) => {
    switch (status) {
      case "opened": return "開封済み";
      case "expired": return "期限切れ";
      default: return "未開封";
    }
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/claim/${token}`;
    void navigator.clipboard.writeText(url);
    toast.success("リンクをコピーしました");
  };

  return (
    <div className="relative space-y-6 before:absolute before:inset-y-0 before:left-2 before:w-px before:bg-border/50">
      {items.length > 0 ? (
        items.map((item) => (
          <div key={item.id} className="relative pl-10 animate-in fade-in slide-in-from-left-4 duration-500">
            {/* Timeline Dot */}
            <div className={cn(
              "absolute left-0 top-1.5 h-4 w-4 rounded-full border-4 border-background z-10",
              item.status === "opened" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : 
              item.status === "expired" ? "bg-destructive" : "bg-amber-500"
            )} />
            
            <div className="glass p-4 rounded-2xl border-border/40 hover:border-emerald-500/30 transition-all group">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-sm group-hover:text-emerald-600 transition-colors">{item.campaignName}</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.date}</p>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted/50 border border-border/50">
                  {getStatusIcon(item.status)}
                  <span className="text-[10px] font-bold uppercase">{getStatusLabel(item.status)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 bg-background/40 rounded-xl border border-border/30 mb-3">
                <Package className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium truncate">{item.fileName}</span>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 text-[10px] rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                  onClick={() => copyLink(item.token)}
                >
                  <Copy className="w-3 h-3 mr-1.5" />
                  リンクをコピー
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 text-[10px] rounded-lg hover:bg-muted"
                  asChild
                >
                  <a href={`/claim/${item.token}?preview=true`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3 h-3 mr-1.5" />
                    プレビュー
                  </a>
                </Button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground italic">履歴が見つかりませんでした</p>
        </div>
      )}
    </div>
  );
}
