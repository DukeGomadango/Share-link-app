"use client";

import { cn } from "@/lib/utils";
import {
  Users,
  MoreHorizontal,
  Globe,
  MessageSquare,
  Plus,
  History,
  Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Recipient } from "@/components/features/campaigns/types";
import { RecipientMobileList } from "@/components/features/recipients/RecipientMobileList";

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
  onDelete,
}: RecipientTableProps) {
  const isAllSelected =
    recipients.length > 0 && selectedRecipientIds.size === recipients.length;

  return (
    <>
      <RecipientMobileList
        recipients={recipients}
        selectedRecipientIds={selectedRecipientIds}
        onSelectRecipient={onSelectRecipient}
        onRowClick={onRowClick}
        onAssign={onAssign}
        onDelete={onDelete}
      />

      <div className="hidden overflow-x-auto rounded-2xl glass border-border/50 shadow-xl md:block">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border/30 bg-muted/20">
              <th className="w-12 p-5">
                <Checkbox checked={isAllSelected} onCheckedChange={onSelectAll} />
              </th>
              <th className="p-5 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                受取人
              </th>
              <th className="p-5 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                ID / タグ
              </th>
              <th className="p-5 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                最終更新
              </th>
              <th className="p-5 pr-8 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {recipients.length > 0 ? (
              recipients.map((recipient) => (
                <tr
                  key={recipient.id}
                  className={cn(
                    "group cursor-pointer transition-all hover:bg-emerald-500/[0.02]",
                    selectedRecipientIds.has(recipient.id) ? "bg-emerald-500/5" : ""
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
                          <span className="text-sm font-black text-foreground transition-colors group-hover:text-emerald-600">
                            {recipient.name}
                          </span>
                          {recipient.passkeyVerified && (
                            <Shield className="h-3 w-3 fill-sky-500/10 text-sky-500" />
                          )}
                          {recipient.status === "waiting" ? (
                            <span
                              className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500"
                              title="Waiting"
                            />
                          ) : recipient.status === "verified" ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" title="Verified" />
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="受取済" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            ID: {recipient.id.toUpperCase().slice(0, 8)}
                          </span>
                          <div className="flex items-center gap-1">
                            {recipient.status === "waiting" ? (
                              <Badge
                                variant="outline"
                                className="h-4 border-amber-500/20 bg-amber-500/5 px-1.5 text-[9px] font-bold text-amber-600 uppercase"
                              >
                                Waiting
                              </Badge>
                            ) : recipient.status === "verified" ? (
                              <Badge
                                variant="outline"
                                className="h-4 border-sky-500/20 bg-sky-500/5 px-1.5 text-[9px] font-bold text-sky-600 uppercase"
                              >
                                Verified
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="h-4 border-emerald-500/20 bg-emerald-500/5 px-1.5 text-[9px] font-bold text-emerald-600"
                              >
                                受取済
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col gap-2">
                      {recipient.platformId && (
                        <div className="flex items-center text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
                          {recipient.platformId.type === "twitter" ? (
                            <Globe className="mr-1 h-3 w-3 text-sky-400" />
                          ) : (
                            <MessageSquare className="mr-1 h-3 w-3 text-indigo-400" />
                          )}
                          {recipient.platformId.handle}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {recipient.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="h-4 border-emerald-500/20 bg-emerald-500/5 px-1.5 text-[9px] text-emerald-600"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </td>

                  <td className="p-5 text-sm text-muted-foreground">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">
                        {new Date(recipient.updatedAt).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] opacity-50">
                        {new Date(recipient.updatedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="p-5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        data-touch-target="primary"
                        className="h-9 border-emerald-500/20 px-3 text-xs font-bold text-emerald-600 shadow-sm hover:bg-emerald-500/10 md:opacity-0 md:group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAssign(recipient);
                        }}
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        割り当て
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-touch-target="primary"
                            className="h-9 w-9 rounded-full hover:bg-muted"
                            aria-label="その他の操作"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            className="text-xs font-medium"
                            onClick={() => onRowClick(recipient)}
                          >
                            <History className="mr-2 h-3.5 w-3.5 opacity-60" />
                            履歴を表示
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-xs font-medium"
                            onClick={() => onRowClick(recipient)}
                          >
                            編集
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-xs font-medium text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              if (
                                window.confirm(`${recipient.name} さんを削除してもよろしいですか？`)
                              ) {
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
                    <div className="rounded-full bg-muted p-4">
                      <Users className="h-10 w-10" />
                    </div>
                    <p className="text-sm font-medium">受取人が見つかりませんでした</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
