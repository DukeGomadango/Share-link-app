"use client";

import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Recipient } from "@/components/features/campaigns/types";
import { UserAvatar } from "@/components/ui/user-avatar";
import { 
  Package, 
  Music, 
  Image as ImageIcon, 
  Plus, 
  Loader2, 
  AlertCircle, 
  Search, 
  ChevronDown, 
  ChevronRight,
  Filter,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface QuickAssignModalProps {
  recipient: Recipient | null;
  isOpen: boolean;
  onClose: () => void;
  onAssign: (recipientId: string, fileIds: string[]) => void;
}

type CampaignWithFiles = {
  id: string;
  name: string;
  date: string;
  status: string;
  files: {
    id: string;
    name: string;
    type: string;
  }[];
};

export function QuickAssignModal({ recipient, isOpen, onClose, onAssign }: QuickAssignModalProps) {
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [campaigns, setCampaigns] = useState<CampaignWithFiles[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Scaling features states
  const [searchQuery, setSearchQuery] = useState("");
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [expandedCampaignIds, setExpandedCampaignIds] = useState<Set<string>>(new Set());

  // キャンペーン一覧とそのアセットを取得
  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/campaigns");
      if (!res.ok) throw new Error("Failed to fetch campaigns");
      const data = (await res.json()) as Array<{
        id: string;
        name: string;
        createdAt: string;
        status: string;
        stats?: { totalFiles?: number };
      }>;

      // active なキャンペーンを優先し、最近のものから表示
      const sorted = data
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // 各キャンペーンのワークフロー（ファイル情報）を並行取得 (一旦最新10件まで拡大)
      const campaignsWithFiles: CampaignWithFiles[] = await Promise.all(
        sorted.slice(0, 10).map(async (camp) => {
          try {
            const wfRes = await fetch(`/api/campaigns/${camp.id}/workflow`);
            if (!wfRes.ok) return { id: camp.id, name: camp.name, date: camp.createdAt.split("T")[0], status: camp.status, files: [] };
            const wfData = (await wfRes.json()) as {
              poolFiles: Array<{ id: string; name: string; type: string }>;
            };
            return {
              id: camp.id,
              name: camp.name,
              date: camp.createdAt.split("T")[0],
              status: camp.status,
              files: wfData.poolFiles.map((f) => ({
                id: f.id,
                name: f.name,
                type: f.type,
              })),
            };
          } catch {
            return { id: camp.id, name: camp.name, date: camp.createdAt.split("T")[0], status: camp.status, files: [] };
          }
        })
      );

      const validCampaigns = campaignsWithFiles.filter((c) => c.files.length > 0);
      setCampaigns(validCampaigns);
      
      // 最初の一つを展開
      if (validCampaigns.length > 0) {
        setExpandedCampaignIds(new Set([validCampaigns[0].id]));
      }
    } catch (e) {
      console.error(e);
      setError("キャンペーンデータの取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setSelectedFileIds(new Set());
      setSearchQuery("");
      setShowSelectedOnly(false);
      await fetchCampaigns();
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, fetchCampaigns]);

  // Filtering Logic
  const filteredCampaigns = useMemo(() => {
    return campaigns.map(camp => {
      const filteredFiles = camp.files.filter(f => {
        const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             camp.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSelection = !showSelectedOnly || selectedFileIds.has(f.id);
        return matchesSearch && matchesSelection;
      });

      return { ...camp, files: filteredFiles };
    }).filter(camp => camp.files.length > 0);
  }, [campaigns, searchQuery, showSelectedOnly, selectedFileIds]);

  if (!recipient) return null;

  const handleConfirm = async () => {
    if (selectedFileIds.size === 0 || !recipient) return;
    setAssigning(true);

    const fileIdToCampaign = new Map<string, string>();
    for (const camp of campaigns) {
      for (const file of camp.files) {
        fileIdToCampaign.set(file.id, camp.id);
      }
    }

    const byCampaign = new Map<string, string[]>();
    for (const fid of selectedFileIds) {
      const cid = fileIdToCampaign.get(fid);
      if (!cid) continue;
      const list = byCampaign.get(cid) ?? [];
      list.push(fid);
      byCampaign.set(cid, list);
    }

    try {
      for (const [campaignId, assetIds] of byCampaign) {
        await fetch(`/api/campaigns/${campaignId}/recipient-slots`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipientId: recipient.id,
            recipientDisplayName: recipient.name,
            campaignAssetIds: assetIds,
          }),
        });
      }
      onAssign(recipient.id, Array.from(selectedFileIds));
      onClose();
    } catch (e) {
      console.error(e);
      setError("割り当てに失敗しました。");
    } finally {
      setAssigning(false);
    }
  };

  const toggleFile = (fileId: string) => {
    const newSelected = new Set(selectedFileIds);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFileIds(newSelected);
  };

  const toggleExpand = (campaignId: string) => {
    const newExpanded = new Set(expandedCampaignIds);
    if (newExpanded.has(campaignId)) {
      newExpanded.delete(campaignId);
    } else {
      newExpanded.add(campaignId);
    }
    setExpandedCampaignIds(newExpanded);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "audio": return <Music className="w-4 h-4" />;
      case "image": return <ImageIcon className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const statusLabel = (s: string) => {
    switch (s) {
      case "active": return { text: "配布中", cls: "bg-emerald-500/10 text-emerald-600" };
      case "draft": return { text: "下書き", cls: "bg-amber-500/10 text-amber-600" };
      case "archived": return { text: "終了", cls: "bg-zinc-500/10 text-zinc-500" };
      default: return { text: s, cls: "bg-muted text-muted-foreground" };
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} className="max-w-4xl">
      <DialogHeader>
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600">
            <Plus className="w-6 h-6" />
          </div>
          <div>
            <DialogTitle>ファイルをクイック割り当て</DialogTitle>
            <DialogDescription>キャンペーンのファイルを選択して受取人に紐付けます</DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-4">
        {/* Left Sidebar: Recipient Info & Summary */}
        <div className="md:col-span-4 space-y-6">
          <div className="p-6 rounded-3xl bg-muted/30 border border-border/50 flex flex-col items-center text-center">
            <UserAvatar name={recipient.name} size="lg" className="mb-4" />
            <h3 className="font-bold text-lg">{recipient.name}</h3>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              ID: {recipient.id.toUpperCase().slice(0, 8)}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-1">
              {recipient.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-[9px] bg-background/50 border-emerald-500/20 text-emerald-600">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
              <Input 
                placeholder="ファイル・キャンペーンを検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-background/50 border-emerald-500/10 rounded-xl focus-visible:ring-emerald-500/30"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSelectedOnly(!showSelectedOnly)}
              className={cn(
                "w-full h-10 rounded-xl justify-start font-bold text-xs transition-all",
                showSelectedOnly ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600" : "bg-background/50 text-muted-foreground"
              )}
            >
              <Filter className="w-3.5 h-3.5 mr-2" />
              {showSelectedOnly ? "すべてのファイルを表示" : "選択中のみ表示"}
              {selectedFileIds.size > 0 && (
                <Badge className="ml-auto bg-emerald-500 text-white border-none h-5 px-1.5 min-w-[20px] justify-center">
                  {selectedFileIds.size}
                </Badge>
              )}
            </Button>
          </div>

          {selectedFileIds.size > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15"
            >
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {selectedFileIds.size} 件のファイルを選択中
              </p>
              <p className="text-[10px] text-emerald-600/70 mt-1">
                確定すると、選択したキャンペーンに受取人として追加されます。
              </p>
            </motion.div>
          )}
        </div>

        {/* Right Main Content: Collapsible Lists */}
        <div className="md:col-span-8 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-50">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              <p className="text-xs font-medium">キャンペーンとファイルを読み込み中...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <AlertCircle className="w-10 h-10 text-destructive/40" />
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center opacity-40">
              <Package className="w-12 h-12" />
              <p className="text-xs font-medium">条件に合うファイルが見つかりませんでした。</p>
              {searchQuery && (
                <Button variant="link" size="sm" onClick={() => setSearchQuery("")} className="text-emerald-600 h-auto p-0">
                  検索をリセット
                </Button>
              )}
            </div>
          ) : (
            filteredCampaigns.map((campaign) => {
              const isExpanded = expandedCampaignIds.has(campaign.id) || searchQuery.length > 0;
              const sl = statusLabel(campaign.status);
              const selectedInThisCampaign = campaign.files.filter(f => selectedFileIds.has(f.id)).length;
              
              return (
                <div key={campaign.id} className="rounded-2xl border border-border/40 overflow-hidden bg-background/20 group/campaign">
                  {/* Campaign Header / Accordion Trigger */}
                  <button
                    onClick={() => toggleExpand(campaign.id)}
                    className="w-full flex items-center justify-between p-4 bg-muted/10 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 group-hover/campaign:scale-110 transition-transform">
                        <Package className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                          {campaign.name}
                          {selectedInThisCampaign > 0 && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          )}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md", sl.cls)}>
                            {sl.text}
                          </span>
                          <span className="text-[10px] text-muted-foreground/60">{campaign.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {selectedInThisCampaign > 0 && (
                        <span className="text-[10px] font-black text-emerald-600/60 uppercase">
                          {selectedInThisCampaign} Selected
                        </span>
                      )}
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {/* File List */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="p-3 grid grid-cols-1 gap-2 border-t border-border/20">
                          {campaign.files.map((file) => {
                            const isSelected = selectedFileIds.has(file.id);
                            return (
                              <button
                                key={file.id}
                                onClick={() => toggleFile(file.id)}
                                className={cn(
                                  "flex items-center justify-between p-3 rounded-xl border transition-all text-left",
                                  isSelected 
                                    ? "bg-emerald-500/10 border-emerald-500/50 shadow-sm" 
                                    : "bg-background/40 border-transparent hover:border-border/60 hover:bg-background/60"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "p-2 rounded-lg transition-colors",
                                    isSelected ? "bg-emerald-500 text-white" : "bg-muted/50 text-muted-foreground"
                                  )}>
                                    {getFileIcon(file.type)}
                                  </div>
                                  <div>
                                    <p className={cn(
                                      "text-xs font-bold truncate max-w-[200px]",
                                      isSelected ? "text-emerald-700" : "text-foreground"
                                    )}>{file.name}</p>
                                    <p className="text-[9px] text-muted-foreground uppercase">{file.type}</p>
                                  </div>
                                </div>
                                <div className={cn(
                                  "w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center",
                                  isSelected ? "bg-emerald-500 border-emerald-500" : "border-border/30 bg-background/50"
                                )}>
                                  {isSelected && <Plus className="w-3.5 h-3.5 text-white" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-8">
        <Button variant="ghost" className="flex-1 rounded-2xl h-12 font-bold" onClick={onClose}>
          キャンセル
        </Button>
        <Button 
          className="flex-[2] rounded-2xl h-12 bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 disabled:opacity-50 disabled:grayscale transition-all font-bold"
          disabled={selectedFileIds.size === 0 || assigning}
          onClick={() => void handleConfirm()}
        >
          {assigning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              割り当て中...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              {selectedFileIds.size > 0 ? `${selectedFileIds.size} 件の割り当てを確定` : "割り当てを確定"}
            </>
          )}
        </Button>
      </div>
    </Dialog>
  );
}
