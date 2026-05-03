"use client";

import { cn } from "@/lib/utils";
import { useRecipients } from "@/hooks/features/recipients/useRecipients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  MoreHorizontal, 
  Tag as TagIcon,
  Trash2,
  Download,
  UserPlus,
  Shield,
  MessageSquare,
  Globe,
  ArrowRight,
  History,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useTranslation } from "@/lib/i18n";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { RecipientDetailDrawer } from "@/components/features/recipients/RecipientDetailDrawer";
import type { Recipient } from "@/components/features/campaigns/types";
import { useState } from "react";

export default function RecipientsPage() {
  const { 
    recipients, 
    searchQuery, 
    setSearchQuery, 
    activeFilter, 
    setActiveFilter,
    selectedRecipientIds,
    selectRecipient,
    selectAll,
    deleteSelected,
    updateRecipientTags,
    updateRecipientInfo,
    addRecipient,
    bulkUpdateTags,
    allUniqueTags,
    stats
  } = useRecipients();
  const { t } = useTranslation();
  const [detailRecipient, setDetailRecipient] = useState<Recipient | null>(null);

  const handleRowClick = (recipient: Recipient) => {
    setDetailRecipient(recipient);
  };

  const handleBulkAddTags = () => {
    const suggestions = allUniqueTags.length > 0 ? `\n既存のタグ: ${allUniqueTags.join(", ")}` : "";
    const tagStr = window.prompt(`追加するタグをカンマ区切りで入力してください (例: VIP, 2024春)${suggestions}`);
    if (!tagStr) return;
    const tags = tagStr.split(",").map(s => s.trim()).filter(Boolean);
    if (tags.length > 0) {
      bulkUpdateTags(selectedRecipientIds, tags, "add");
    }
  };

  const handleCreateRecipient = () => {
    const newRecipient = addRecipient();
    setDetailRecipient(newRecipient);
  };

  return (
    <div className="space-y-6 relative pb-24 px-1 min-h-screen">
      {/* Premium Texture Overlay */}
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {t.nav.recipients}
          </h1>
          <p className="text-muted-foreground mt-1">
            配信先リスナーの名簿を一元管理します。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="glass">
            <Download className="w-4 h-4 mr-2" />
            CSVインポート
          </Button>
          <Button 
            size="sm" 
            className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
            onClick={handleCreateRecipient}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            新規受取人
          </Button>
        </div>
      </div>

      {/* Insight Stats (Strategic Minimalism + Data Density) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { 
            id: "waiting", 
            label: "待機中 (Waiting)", 
            count: stats.waiting, 
            trend: stats.trends.waiting,
            rate: stats.breakdown.waitingRate,
            icon: Clock, 
            color: "amber",
            description: "紐付け未完了のリスナー",
            cta: "未対応を確認"
          },
          { 
            id: "verified", 
            label: "認証済み (Verified)", 
            count: stats.verified, 
            trend: stats.trends.verified,
            rate: stats.breakdown.verifiedRate,
            icon: Shield, 
            color: "sky",
            description: "パスキー登録済みユーザー",
            cta: "認証済みのみ表示"
          },
          { 
            id: "claimed", 
            label: "受取済 (Claimed)", 
            count: stats.claimed, 
            trend: stats.trends.claimed,
            rate: stats.breakdown.claimedRate,
            icon: CheckCircle2, 
            color: "emerald",
            description: "ファイルの受取完了率",
            cta: "履歴を確認"
          }
        ].map((item) => {
          const colorClasses = {
            amber: activeFilter === item.id 
              ? "bg-amber-500/10 border-amber-500/50 shadow-amber-500/10 text-amber-600" 
              : "text-amber-500",
            sky: activeFilter === item.id 
              ? "bg-sky-500/10 border-sky-500/50 shadow-sky-500/10 text-sky-600" 
              : "text-sky-500",
            emerald: activeFilter === item.id 
              ? "bg-emerald-500/10 border-emerald-500/50 shadow-emerald-500/10 text-emerald-600" 
              : "text-emerald-500",
          }[item.color as "amber" | "sky" | "emerald"];

          const iconBgClasses = {
            amber: activeFilter === item.id ? "bg-amber-500" : "bg-muted/50",
            sky: activeFilter === item.id ? "bg-sky-500" : "bg-muted/50",
            emerald: activeFilter === item.id ? "bg-emerald-500" : "bg-muted/50",
          }[item.color as "amber" | "sky" | "emerald"];

          return (
            <button
              key={item.id}
              onClick={() => setActiveFilter(activeFilter === item.id ? "all" : (item.id as any))}
              className={cn(
                "flex flex-col p-6 rounded-[2rem] border transition-all text-left relative overflow-hidden group",
                activeFilter === item.id 
                  ? `${colorClasses} border-solid shadow-xl` 
                  : "bg-background/40 backdrop-blur-md border-white/10 hover:border-white/20 hover:bg-background/60 shadow-lg"
              )}
            >
              {/* Premium Background Noise & Gradient */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
              <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-10 pointer-events-none transition-opacity bg-gradient-to-br",
                activeFilter === item.id ? "from-transparent to-transparent" : `from-transparent to-${item.color}-500`
              )} />

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn(
                    "p-2.5 rounded-2xl transition-all shadow-inner",
                    iconBgClasses,
                    activeFilter === item.id ? "text-white scale-110" : "text-muted-foreground group-hover:text-foreground"
                  )}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={cn(
                      "text-3xl font-black tracking-tighter transition-colors",
                      activeFilter === item.id ? "" : "text-foreground"
                    )}>
                      {item.count}
                    </span>
                    {item.trend && (
                      <div className={cn(
                        "flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-1",
                        item.trend.isRate ? "bg-emerald-500/10 text-emerald-600" : "bg-sky-500/10 text-sky-600"
                      )}>
                        {item.trend.isUp && <TrendingUp className="w-2.5 h-2.5 mr-0.5" />}
                        {item.trend.value}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="font-black text-sm uppercase tracking-wide">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">{item.description}</p>
                </div>

                {/* Progress Bar (Breakdown) */}
                <div className="mt-6 space-y-2">
                  <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all duration-1000 ease-out rounded-full",
                        activeFilter === item.id ? "bg-current" : `bg-${item.color}-500/50`
                      )}
                      style={{ width: `${item.rate}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center">
                      {item.cta} <ChevronRight className="w-3 h-3 ml-0.5" />
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">Click to focus</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="名前またはプラットフォームIDで検索..." 
            className="pl-10 bg-background/50 border-border/50 rounded-xl focus-visible:ring-emerald-500/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setActiveFilter("all")}
            className={cn(
              "text-xs font-semibold rounded-lg px-4 h-9",
              activeFilter === "all" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
            )}
          >
            すべて表示
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setActiveFilter("noTags")}
            className={cn(
              "text-xs font-semibold rounded-lg px-4 h-9",
              activeFilter === "noTags" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
            )}
          >
            タグなし
          </Button>
        </div>
      </div>

      {/* Recipients List */}
      <div className="glass rounded-2xl border-border/50 overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border/30 bg-muted/20">
              <th className="p-5 w-12">
                <Checkbox 
                  checked={recipients.length > 0 && selectedRecipientIds.size === recipients.length}
                  onCheckedChange={selectAll}
                />
              </th>
              <th className="p-5 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">受取人</th>
              <th className="p-5 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">ID / タグ</th>
              <th className="p-5 text-xs font-bold uppercase tracking-wider text-muted-foreground/70 text-center">ステータス</th>
              <th className="p-5 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">最終更新</th>
              <th className="p-5 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {recipients.length > 0 ? (
              recipients.map((recipient) => (
                <tr 
                  key={recipient.id} 
                  className={cn(
                    "group hover:bg-emerald-500/[0.02] transition-all cursor-pointer",
                    selectedRecipientIds.has(recipient.id) ? 'bg-emerald-500/5' : ''
                  )}
                  onClick={() => handleRowClick(recipient)}
                >
                  <td className="p-5" onClick={(e) => e.stopPropagation()}>
                    <Checkbox 
                      checked={selectedRecipientIds.has(recipient.id)}
                      onCheckedChange={() => selectRecipient(recipient.id)}
                    />
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-4">
                      <UserAvatar name={recipient.name} size="md" />
                      <div>
                        <div className="font-black text-sm text-foreground group-hover:text-emerald-600 transition-colors flex items-center gap-1.5">
                          {recipient.name}
                          {recipient.passkeyVerified && (
                            <Shield className="w-3 h-3 text-sky-500" fill="currentColor" fillOpacity={0.1} />
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5 font-medium">
                          ID: {recipient.id.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col gap-2">
                      {recipient.platformId ? (
                        <div className="flex items-center text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                          {recipient.platformId.type === "twitter" ? (
                            <Globe className="w-3 h-3 mr-1 text-sky-400" />
                          ) : (
                            <MessageSquare className="w-3 h-3 mr-1 text-indigo-400" />
                          )}
                          {recipient.platformId.handle}
                        </div>
                      ) : (
                        <div className="text-[10px] italic text-muted-foreground/40">ID未連携</div>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {recipient.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-[9px] h-4 px-1.5 border-emerald-500/20 text-emerald-600 bg-emerald-500/5"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col items-center">
                      {recipient.status === "waiting" ? (
                        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-bold uppercase tracking-widest px-3">
                          Waiting
                        </Badge>
                      ) : recipient.status === "verified" ? (
                        <Badge className="bg-sky-500/10 text-sky-600 border-sky-500/20 text-[10px] font-bold uppercase tracking-widest px-3">
                          Verified
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold uppercase tracking-widest px-3">
                          Claimed
                        </Badge>
                      )}
                      
                      {/* Hover Actions (露出) */}
                      <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-bold text-emerald-600 hover:bg-emerald-500/10">
                          <Plus className="w-3 h-3 mr-1" /> Assign
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-bold text-muted-foreground">
                          <History className="w-3 h-3 mr-1" /> Log
                        </Button>
                      </div>
                    </div>
                  </td>
                  <td className="p-5 text-sm text-muted-foreground">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">{new Date(recipient.updatedAt).toLocaleDateString()}</span>
                      <span className="text-[10px] opacity-50">{new Date(recipient.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </td>
                  <td className="p-5" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>編集</DropdownMenuItem>
                        <DropdownMenuItem>タグを編集</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">削除</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-20 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4 opacity-40">
                    <div className="p-4 rounded-full bg-muted">
                      <Users className="w-10 h-10" />
                    </div>
                    <p className="text-sm font-medium">受取人が見つかりませんでした</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedRecipientIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-foreground text-background px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 min-w-[400px]">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500 text-white border-none h-6 w-6 flex items-center justify-center p-0 rounded-full">
                {selectedRecipientIds.size}
              </Badge>
              <span className="text-sm font-medium">個を選択中</span>
            </div>
            
            <div className="h-6 w-px bg-background/20" />
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-background hover:bg-background/10"
                onClick={handleBulkAddTags}
              >
                <TagIcon className="w-4 h-4 mr-2" />
                タグを一括変更
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-destructive-foreground hover:bg-destructive/20"
                onClick={deleteSelected}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                削除
              </Button>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-auto text-background/50 hover:text-background"
              onClick={() => selectAll()}
            >
              <Plus className="w-4 h-4 rotate-45" />
            </Button>
          </div>
        </div>
      )}
      {/* Drawer */}
      <RecipientDetailDrawer 
        recipient={detailRecipient} 
        isOpen={!!detailRecipient} 
        onClose={() => setDetailRecipient(null)} 
        onUpdateTags={updateRecipientTags}
        onUpdateInfo={updateRecipientInfo}
        existingTags={allUniqueTags}
      />
    </div>
  );
}
