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
import { QuickAssignModal } from "@/components/features/recipients/QuickAssignModal";
import { TagAddModal } from "@/components/features/recipients/TagAddModal";
import type { Recipient } from "@/components/features/campaigns/types";
import { useState } from "react";
import { toast } from "sonner";

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
    deleteRecipient,
    updateRecipientTags,
    updateRecipientInfo,
    addRecipient,
    bulkUpdateTags,
    bulkAddRecipients,
    allUniqueTags,
    stats,
    isLoading
  } = useRecipients();
  const { t } = useTranslation();
  const [detailRecipientId, setDetailRecipientId] = useState<string | null>(null);
  const [assignRecipientId, setAssignRecipientId] = useState<string | null>(null);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);

  const detailRecipient = recipients.find(r => r.id === detailRecipientId) || null;
  const assignRecipient = recipients.find(r => r.id === assignRecipientId) || null;

  const handleRowClick = (recipient: Recipient) => {
    setDetailRecipientId(recipient.id);
  };

  const handleBulkAddTags = () => {
    setIsTagModalOpen(true);
  };

  const handleConfirmTags = (tags: string[]) => {
    if (tags.length > 0) {
      bulkUpdateTags(selectedRecipientIds, tags, "add");
    }
  };

  const handleCreateRecipient = async () => {
    const newRecipient = await addRecipient();
    if (newRecipient) {
      setDetailRecipientId(newRecipient.id);
    }
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter(line => line.trim());
      
      // Basic CSV parse (assuming: name, tags, platform_type, platform_handle)
      const data = lines.slice(1).map(line => {
        const parts = line.split(",").map(p => p.trim());
        return {
          name: parts[0],
          tags: parts[1] ? parts[1].split(";").map(t => t.trim()) : [],
          platformId: parts[2] && parts[3] ? { type: parts[2], handle: parts[3] } : undefined,
        };
      }).filter(r => r.name);

      if (data.length > 0) {
        const ok = await bulkAddRecipients(data);
        if (ok) toast.success(`${data.length}件の受取人をインポートしました。`);
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // Reset
  };

  const handleAssign = (recipient: Recipient) => {
    setAssignRecipientId(recipient.id);
  };

  const handleQuickAssign = (recipientId: string, fileIds: string[]) => {
    console.log(`Assigned ${fileIds.length} files to recipient ${recipientId}`);
    setAssignRecipientId(null);
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
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
              onChange={handleCsvImport}
              title="CSVをインポート"
            />
            <Button variant="outline" size="sm" className="glass">
              <Download className="w-4 h-4 mr-2" />
              CSVインポート
            </Button>
          </div>
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
      {isLoading ? (
        <div className="glass rounded-2xl border-border/50 p-20 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">リスナー名簿を読み込み中...</p>
        </div>
      ) : (
        <RecipientTable 
          recipients={recipients}
          selectedRecipientIds={selectedRecipientIds}
          onSelectAll={selectAll}
          onSelectRecipient={selectRecipient}
          onRowClick={handleRowClick}
          onAssign={handleAssign}
          onDelete={deleteRecipient}
        />
      )}

      {/* Floating Bulk Action Bar */}
      <RecipientBulkActions 
        selectedCount={selectedRecipientIds.size}
        onBulkAddTags={handleBulkAddTags}
        onDeleteSelected={deleteSelected}
        onClearSelection={selectAll}
      />

      {/* Detail Drawer */}
      <RecipientDetailDrawer 
        recipient={detailRecipient} 
        isOpen={!!detailRecipientId} 
        onClose={() => setDetailRecipientId(null)} 
        onUpdateTags={updateRecipientTags}
        onUpdateInfo={updateRecipientInfo}
        onRemoveRecipient={deleteRecipient}
        existingTags={allUniqueTags}
      />

      {/* Quick Assign Modal */}
      <QuickAssignModal 
        recipient={assignRecipient}
        isOpen={!!assignRecipientId}
        onClose={() => setAssignRecipientId(null)}
        onAssign={handleQuickAssign}
      />

      <TagAddModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        onConfirm={handleConfirmTags}
        existingTags={allUniqueTags}
        selectedCount={selectedRecipientIds.size}
      />
    </div>
  );
}
