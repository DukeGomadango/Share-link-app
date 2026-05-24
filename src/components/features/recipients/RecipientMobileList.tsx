"use client";

import {
  Globe,
  History,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Shield,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Recipient } from "@/components/features/campaigns/types";

interface RecipientMobileListProps {
  recipients: Recipient[];
  selectedRecipientIds: Set<string>;
  onSelectRecipient: (id: string) => void;
  onRowClick: (recipient: Recipient) => void;
  onAssign: (recipient: Recipient) => void;
  onDelete: (id: string) => void;
}

function StatusBadge({ status }: { status: Recipient["status"] }) {
  if (status === "waiting") {
    return (
      <Badge
        variant="outline"
        className="h-5 border-amber-500/20 bg-amber-500/5 px-2 text-[10px] font-bold text-amber-600 uppercase"
      >
        Waiting
      </Badge>
    );
  }
  if (status === "verified") {
    return (
      <Badge
        variant="outline"
        className="h-5 border-sky-500/20 bg-sky-500/5 px-2 text-[10px] font-bold text-sky-600 uppercase"
      >
        Verified
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="h-5 border-emerald-500/20 bg-emerald-500/5 px-2 text-[10px] font-bold text-emerald-600"
    >
      受取済
    </Badge>
  );
}

export function RecipientMobileList({
  recipients,
  selectedRecipientIds,
  onSelectRecipient,
  onRowClick,
  onAssign,
  onDelete,
}: RecipientMobileListProps) {
  if (recipients.length === 0) {
    return (
      <div className="glass rounded-2xl border-border/50 p-12 text-center shadow-xl md:hidden">
        <div className="flex flex-col items-center justify-center space-y-4 opacity-40">
          <div className="rounded-full bg-muted p-4">
            <Users className="h-10 w-10" />
          </div>
          <p className="text-sm font-medium">受取人が見つかりませんでした</p>
        </div>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3 md:hidden" aria-label="受取人一覧">
      {recipients.map((recipient) => {
        const selected = selectedRecipientIds.has(recipient.id);
        return (
          <li
            key={recipient.id}
            className={cn(
              "glass rounded-2xl border border-border/50 p-4 shadow-lg transition-colors",
              selected && "border-emerald-500/30 bg-emerald-500/5"
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex min-h-11 min-w-11 items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox
                  checked={selected}
                  onCheckedChange={() => onSelectRecipient(recipient.id)}
                  aria-label={`${recipient.name} を選択`}
                />
              </div>
              <button
                type="button"
                className="flex min-w-0 flex-1 flex-col gap-2 text-left"
                onClick={() => onRowClick(recipient)}
              >
                <div className="flex items-center gap-3">
                  <UserAvatar name={recipient.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-sm font-black text-foreground">
                        {recipient.name}
                      </span>
                      {recipient.passkeyVerified && (
                        <Shield className="h-3.5 w-3.5 shrink-0 text-sky-500 fill-sky-500/10" />
                      )}
                      <StatusBadge status={recipient.status} />
                    </div>
                    <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      ID: {recipient.id.toUpperCase().slice(0, 8)}
                    </p>
                  </div>
                </div>
                {recipient.platformId && (
                  <p className="flex items-center text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
                    {recipient.platformId.type === "twitter" ? (
                      <Globe className="mr-1 h-3 w-3 text-sky-400" />
                    ) : (
                      <MessageSquare className="mr-1 h-3 w-3 text-indigo-400" />
                    )}
                    {recipient.platformId.handle}
                  </p>
                )}
                {recipient.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {recipient.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="h-5 border-emerald-500/20 bg-emerald-500/5 px-2 text-[9px] text-emerald-600"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {new Date(recipient.updatedAt).toLocaleString("ja-JP", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </p>
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2 border-t border-border/30 pt-3">
              <Button
                variant="outline"
                size="touch"
                className="min-h-11 flex-1 border-emerald-500/20 font-bold text-emerald-600"
                onClick={() => onAssign(recipient)}
              >
                <Plus className="mr-1 h-4 w-4" />
                割り当て
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-11 shrink-0 rounded-full"
                    aria-label="その他の操作"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem className="min-h-11 text-xs font-medium" onClick={() => onRowClick(recipient)}>
                    <History className="mr-2 h-3.5 w-3.5 opacity-60" />
                    履歴を表示
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="min-h-11 text-xs font-medium text-destructive hover:bg-destructive/10"
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
          </li>
        );
      })}
    </ul>
  );
}
