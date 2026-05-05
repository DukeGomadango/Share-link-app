import { Check, Copy, Megaphone, Edit2, ChevronDown, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/GlassCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Campaign } from "@/components/features/campaigns/types";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface CampaignCardProps {
  campaign: Campaign;
  isFocused: boolean;
  isHighlighted: boolean;
  isSelected: boolean;
  onSelect: (useRange: boolean) => void;
  onPeek: () => void;
  onFocus: () => void;
  formatDate: (date: string) => string;
  isNeedsAttention: boolean;
  isDueSoon: boolean;
  onDelete: () => void;
}

interface PreviewAsset {
  id: string;
  name: string;
  mimeType: string;
  url?: string;
}

export function CampaignCard({
  campaign: initialCampaign,
  isFocused,
  isHighlighted,
  isSelected,
  onSelect,
  onPeek,
  onFocus,
  formatDate,
  isNeedsAttention,
  isDueSoon,
  onDelete,
}: CampaignCardProps) {
  const { t } = useTranslation();
  const [campaign, setCampaign] = useState(initialCampaign);
  const [isHovered, setIsHovered] = useState(false);
  const [previews, setPreviews] = useState<PreviewAsset[]>([]);
  const [loadingPreviews, setLoadingPreviews] = useState(false);
  const [copied, setCopied] = useState(false);

  // Inline Edit states
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(campaign.name);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCampaign(initialCampaign);
    setEditName(initialCampaign.name);
  }, [initialCampaign]);

  useEffect(() => {
    if (isHovered && previews.length === 0 && !loadingPreviews && campaign.stats.totalFiles > 0) {
      setLoadingPreviews(true);
      fetch(`/api/campaigns/${campaign.id}/preview`)
        .then((r) => r.json())
        .then((data) => {
          setPreviews(data.previews || []);
        })
        .catch((e) => console.error("Failed to fetch previews:", e))
        .finally(() => setLoadingPreviews(false));
    }
  }, [isHovered, campaign.id, previews.length, loadingPreviews, campaign.stats.totalFiles]);

  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingName]);

  const getStatusPillClass = (status: Campaign["status"]) => {
    if (status === "active") return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25";
    if (status === "completed") return "bg-sky-500/15 text-sky-400 border-sky-500/30 hover:bg-sky-500/25";
    return "bg-muted text-muted-foreground border-border hover:bg-muted/80";
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!campaign.publicReceptionToken) return;
    const url = `${window.location.origin}/receive/${campaign.publicReceptionToken}`;
    void navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNameSave = async () => {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === campaign.name) {
      setIsEditingName(false);
      setEditName(campaign.name);
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCampaign(updated);
      }
    } catch (e) {
      console.error("Failed to update name:", e);
      setEditName(campaign.name);
    } finally {
      setIsSaving(false);
      setIsEditingName(false);
    }
  };

  const handleStatusChange = async (nextStatus: Campaign["status"]) => {
    if (nextStatus === campaign.status) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCampaign(updated);
      }
    } catch (e) {
      console.error("Failed to update status:", e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <GlassCard
      data-campaign-id={campaign.id}
      tabIndex={0}
      className={`relative group hover:border-emerald-500/50 transition-all duration-300 cursor-pointer outline-none ${
        isFocused ? "ring-2 ring-emerald-500/50" : ""
      } ${isHighlighted ? "ring-2 ring-sky-400/60" : ""} ${
        isHovered ? "translate-y-[-2px] shadow-lg shadow-emerald-500/5" : ""
      }`}
      onClick={onPeek}
      onFocus={onFocus}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <label className="absolute left-4 top-4 z-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(event) =>
            onSelect(Boolean((event.nativeEvent as MouseEvent).shiftKey))
          }
          onClick={(event) => event.stopPropagation()}
          className="h-4 w-4 accent-emerald-500 cursor-pointer"
        />
      </label>

      {/* Quick Actions overlay on hover */}
      <div className={`absolute top-4 right-4 z-20 flex gap-2 transition-opacity duration-200 ${isHovered && !isEditingName ? "opacity-100" : "opacity-0"}`}>
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-emerald-500 hover:text-white transition-colors"
          onClick={handleCopyLink}
          title={t.campaigns.copyLink}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-destructive hover:text-destructive-foreground transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title={t.common.delete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3 pl-6 w-full">
          <div
            className={`p-2 rounded-md transition-colors flex-shrink-0 ${
              campaign.status === "active"
                ? "bg-emerald-500/20 text-emerald-500"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <Megaphone className="w-5 h-5" />
          </div>
          <div className="flex-grow min-w-0">
            {isEditingName ? (
              <input
                ref={inputRef}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNameSave();
                  if (e.key === "Escape") {
                    setIsEditingName(false);
                    setEditName(campaign.name);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full bg-background/50 border-b border-emerald-500 outline-none text-lg font-semibold px-0 py-0"
                disabled={isSaving}
              />
            ) : (
              <div 
                className="group/name flex items-center gap-1.5 cursor-text"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingName(true);
                }}
              >
                <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-emerald-400 transition-colors">
                  {campaign.name}
                </h3>
                <Edit2 className="h-3 w-3 text-muted-foreground opacity-0 group-hover/name:opacity-100 transition-opacity" />
              </div>
            )}
            <p className="text-xs text-muted-foreground">{formatDate(campaign.createdAt)}</p>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className={cn(
                "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors outline-none",
                getStatusPillClass(campaign.status),
                isSaving && "opacity-50 cursor-wait"
              )}
              disabled={isSaving}
            >
              {t.campaigns.status[campaign.status]}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-32 glass border-border/50">
            {(["draft", "active", "completed"] as const).map((s) => (
              <DropdownMenuItem 
                key={s} 
                onClick={() => void handleStatusChange(s)}
                className={cn(
                  "text-xs capitalize",
                  campaign.status === s && "bg-emerald-500/10 text-emerald-500 font-bold"
                )}
              >
                {t.campaigns.status[s]}
                {campaign.status === s && <Check className="ml-auto h-3 w-3" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {isNeedsAttention && (
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-300">
            {t.campaigns.quickFilters.needsAttention}
          </span>
        )}
        {isDueSoon && (
          <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-xs text-purple-300">
            {t.campaigns.quickFilters.dueSoon}
          </span>
        )}
        
        {/* 配布モードラベル */}
        {campaign.securityLevel === "standard" ? (
          <span className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground font-medium">
            公開
          </span>
        ) : (
          <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-xs text-indigo-300 font-bold">
            限定
          </span>
        )}
      </div>



      {/* Hover Preview Section */}
      <div className={`overflow-hidden transition-all duration-300 ${isHovered && previews.length > 0 && !isEditingName ? "h-20 mb-4 opacity-100" : "h-0 opacity-0"}`}>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {previews.map((p) => (
            <div key={p.id} className="relative h-16 w-16 flex-shrink-0 rounded-md border border-border/50 bg-muted overflow-hidden group/thumb">
              {p.mimeType.startsWith("image/") && p.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.url} alt={p.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-[10px] text-center p-1 text-muted-foreground break-all">
                  {p.name.split(".").pop()?.toUpperCase() || "FILE"}
                </div>
              )}
            </div>
          ))}
          {campaign.stats.totalFiles > 4 && (
            <div className="h-16 w-16 flex-shrink-0 rounded-md border border-dashed border-border/50 flex items-center justify-center text-[10px] text-muted-foreground">
              +{campaign.stats.totalFiles - 4}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">{t.campaigns.files}</p>
          <p className="font-semibold">{campaign.stats.totalFiles}</p>
        </div>
        <div className="text-center border-x border-border/50">
          <p className="text-xs text-muted-foreground mb-1">{t.campaigns.assigned}</p>
          <p className="font-semibold">{campaign.stats.assignedRecipients}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">{t.campaigns.openRate}</p>
          <p className="font-semibold">{campaign.stats.openRate}%</p>
        </div>
      </div>

      <Button
        asChild
        variant="outline"
        className="w-full glass group-hover:bg-emerald-500 group-hover:text-white hover:bg-emerald-600 hover:text-white transition-all duration-300 border-border/50"
        onClick={(event) => event.stopPropagation()}
      >
        <Link href={`/campaigns/${campaign.id}`}>{t.common.manage}</Link>
      </Button>
    </GlassCard>
  );
}
