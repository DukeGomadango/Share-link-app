"use client";

import { cn } from "@/lib/utils";
import { useRecipients } from "@/hooks/features/recipients/useRecipients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Download,
  UserPlus,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { RecipientDetailDrawer } from "@/components/features/recipients/RecipientDetailDrawer";
import { RecipientStatsCards } from "@/components/features/recipients/RecipientStatsCards";
import { RecipientTable } from "@/components/features/recipients/RecipientTable";
import { RecipientBulkActions } from "@/components/features/recipients/RecipientBulkActions";
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

      {/* Insight Stats */}
      <RecipientStatsCards 
        stats={stats} 
        activeFilter={activeFilter} 
        setActiveFilter={setActiveFilter} 
      />

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
      <RecipientTable 
        recipients={recipients}
        selectedRecipientIds={selectedRecipientIds}
        onSelectAll={selectAll}
        onSelectRecipient={selectRecipient}
        onRowClick={handleRowClick}
      />

      {/* Floating Bulk Action Bar */}
      <RecipientBulkActions 
        selectedCount={selectedRecipientIds.size}
        onBulkAddTags={handleBulkAddTags}
        onDeleteSelected={deleteSelected}
        onClearSelection={selectAll}
      />

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
