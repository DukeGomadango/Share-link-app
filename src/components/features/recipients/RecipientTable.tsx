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
}

export function RecipientTable({ 
  recipients, 
  selectedRecipientIds, 
  onSelectAll, 
  onSelectRecipient, 
  onRowClick 
}: RecipientTableProps) {
  const isAllSelected = recipients.length > 0 && selectedRecipientIds.size === recipients.length;

  return (
    <div className="glass rounded-2xl border-border/50 overflow-hidden shadow-xl">
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
                    
                    {/* Hover Actions */}
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
  );
}
