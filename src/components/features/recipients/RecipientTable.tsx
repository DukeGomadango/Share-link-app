"use client";

import { cn } from "@/lib/utils";
import { 
  Users, 
  MoreHorizontal, 
  Globe, 
  MessageSquare, 
  Plus, 
  History, 
  Shield 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import type { Recipient } from "@/components/features/campaigns/types";

interface RecipientTableProps {
  recipients: Recipient[];
  selectedRecipientIds: Set<string>;
  onSelectAll: () => void;
  onSelectRecipient: (id: string) => void;
  onRowClick: (recipient: Recipient) => void;
  onAssign: (recipient: Recipient) => void;
  onDelete: (id: string) => void;
}

export function RecipientTable({ 
  recipients, 
  selectedRecipientIds, 
  onSelectAll, 
  onSelectRecipient, 
  onRowClick,
  onAssign,
  onDelete
}: RecipientTableProps) {
  const isAllSelected = recipients.length > 0 && selectedRecipientIds.size === recipients.length;

  return (
    <div className="glass rounded-2xl border-border/50 shadow-xl">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border/30 bg-muted/20">
            <th className="p-5 w-12">
              <Checkbox 
                checked={isAllSelected}
                onCheckedChange={onSelectAll}
              />
            </th>
            <th className="p-5 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">受取人</th>
            <th className="p-5 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">ID / タグ</th>
            <th className="p-5 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">最終更新</th>
            <th className="p-5 text-right pr-8 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">操作</th>
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
                onClick={() => onRowClick(recipient)}
              >
                <td className="p-5" onClick={(e) => e.stopPropagation()}>
                  <Checkbox 
                    checked={selectedRecipientIds.has(recipient.id)}
                    onCheckedChange={() => onSelectRecipient(recipient.id)}
                  />
                </td>
                <td className="p-5">
                  <div className="flex items-center gap-4">
                    <UserAvatar name={recipient.name} size="md" />
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-sm text-foreground group-hover:text-emerald-600 transition-colors">
                          {recipient.name}
                        </span>
                        {recipient.passkeyVerified && (
                          <Shield className="w-3 h-3 text-sky-500 fill-sky-500/10" />
                        )}
                        {recipient.status === "waiting" ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" title="Waiting" />
                        ) : recipient.status === "verified" ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" title="Verified" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Claimed" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                          ID: {recipient.id.toUpperCase().slice(0, 8)}
                        </span>
                        <div className="flex items-center gap-1">
                          {recipient.status === "waiting" ? (
                            <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-amber-500/20 text-amber-600 bg-amber-500/5 font-bold uppercase">Waiting</Badge>
                          ) : recipient.status === "verified" ? (
                            <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-sky-500/20 text-sky-600 bg-sky-500/5 font-bold uppercase">Verified</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-emerald-500/20 text-emerald-600 bg-emerald-500/5 font-bold uppercase">Claimed</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-5">
                  <div className="flex flex-col gap-2">
                    {recipient.platformId && (
                      <div className="flex items-center text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                        {recipient.platformId.type === "twitter" ? (
                          <Globe className="w-3 h-3 mr-1 text-sky-400" />
                        ) : (
                          <MessageSquare className="w-3 h-3 mr-1 text-indigo-400" />
                        )}
                        {recipient.platformId.handle}
                      </div>
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

                <td className="p-5 text-sm text-muted-foreground">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">{new Date(recipient.updatedAt).toLocaleDateString()}</span>
                    <span className="text-[10px] opacity-50">{new Date(recipient.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </td>
                <td className="p-5" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    <div className="opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 px-3 text-xs font-bold border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10 shadow-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAssign(recipient);
                        }}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        割り当て
                      </Button>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem 
                          className="text-xs font-medium"
                          onClick={() => onRowClick(recipient)}
                        >
                          <History className="w-3.5 h-3.5 mr-2 opacity-60" />
                          履歴を表示
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-xs font-medium"
                          onClick={() => onRowClick(recipient)}
                        >
                          編集
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-xs font-medium text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (window.confirm(`${recipient.name} さんを削除してもよろしいですか？`)) {
                              onDelete(recipient.id);
                            }
                          }}
                        >
                          削除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="p-20 text-center">
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
  );
}
