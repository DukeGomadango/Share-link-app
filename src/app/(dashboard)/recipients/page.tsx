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
  Mail, 
  Tag as TagIcon,
  Trash2,
  Download,
  UserPlus
} from "lucide-react";
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
    deleteSelected
  } = useRecipients();
  const { t } = useTranslation();
  const [detailRecipient, setDetailRecipient] = useState<Recipient | null>(null);

  const handleRowClick = (recipient: Recipient) => {
    setDetailRecipient(recipient);
  };

  return (
    <div className="space-y-6 relative pb-24">
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
          <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20">
            <UserPlus className="w-4 h-4 mr-2" />
            新規受取人
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="space-y-4">
        {/* Status Tabs */}
        <div className="flex items-center space-x-1 p-1 bg-muted/30 rounded-xl w-fit border border-border/50">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setActiveFilter("all")}
            className={cn(
              "rounded-lg px-6 py-1.5 text-xs font-semibold transition-all",
              activeFilter === "all" ? "bg-background shadow-sm text-emerald-600" : "text-muted-foreground"
            )}
          >
            すべて
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setActiveFilter("noEmail")}
            className={cn(
              "rounded-lg px-6 py-1.5 text-xs font-semibold transition-all",
              activeFilter === "noEmail" ? "bg-background shadow-sm text-emerald-600" : "text-muted-foreground"
            )}
          >
            メール未設定
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setActiveFilter("noTags")}
            className={cn(
              "rounded-lg px-6 py-1.5 text-xs font-semibold transition-all",
              activeFilter === "noTags" ? "bg-background shadow-sm text-emerald-600" : "text-muted-foreground"
            )}
          >
            タグなし
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="名前またはメールアドレスで検索..." 
              className="pl-10 bg-background/50 border-border/50 rounded-xl focus-visible:ring-emerald-500/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Filter className="w-4 h-4 mr-2" />
              詳細フィルタ
            </Button>
          </div>
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
              <th className="p-5 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">連絡先 / タグ</th>
              <th className="p-5 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">配布実績</th>
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
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                        {recipient.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-foreground group-hover:text-emerald-600 transition-colors">
                          {recipient.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          ID: {recipient.id.padStart(4, '0')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col gap-2">
                      {recipient.email ? (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Mail className="w-3 h-3 mr-2 opacity-60" />
                          {recipient.email}
                        </div>
                      ) : (
                        <span className="text-xs italic text-muted-foreground/40">メール未設定</span>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {recipient.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-[9px] h-4 px-1.5 border-emerald-500/20 text-emerald-600 bg-emerald-500/5">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-xs font-bold">12</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-tighter">累計</div>
                      </div>
                      <div className="h-6 w-px bg-border/30" />
                      <div className="text-center">
                        <div className="text-xs font-bold text-emerald-600">85%</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-tighter">開封率</div>
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
              <Button variant="ghost" size="sm" className="text-background hover:bg-background/10">
                <TagIcon className="w-4 h-4 mr-2" />
                タグを一括変更
              </Button>
              <Button variant="ghost" size="sm" className="text-background hover:bg-background/10">
                <Mail className="w-4 h-4 mr-2" />
                メールを一括設定
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
      />
    </div>
  );
}
