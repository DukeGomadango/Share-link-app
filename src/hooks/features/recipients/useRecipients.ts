import { useState, useMemo } from "react";
import type { Recipient, RecipientFilter } from "@/components/features/campaigns/types";

const MOCK_RECIPIENTS: Recipient[] = [
  {
    id: "1",
    name: "山田 太郎",
    status: "verified",
    platformId: { type: "twitter", handle: "@yamada_live" },
    passkeyVerified: true,
    tags: ["VIP", "Streamer"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "佐藤 花子",
    status: "claimed",
    platformId: { type: "discord", handle: "hanako#1234" },
    tags: ["Normal"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "鈴木 一郎",
    status: "waiting",
    tags: ["Twitter"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "4",
    name: "田中 次郎",
    status: "waiting",
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function useRecipients() {
  const [recipients, setRecipients] = useState<Recipient[]>(MOCK_RECIPIENTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<RecipientFilter>("all");
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<Set<string>>(new Set());

  const filteredRecipients = useMemo(() => {
    return recipients.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.platformId?.handle.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "noTags" && r.tags.length === 0) ||
        activeFilter === r.status;

      return matchesSearch && matchesFilter;
    });
  }, [recipients, searchQuery, activeFilter]);

  const stats = useMemo(() => {
    const total = recipients.length;
    const waiting = recipients.filter((r) => r.status === "waiting").length;
    const verified = recipients.filter((r) => r.status === "verified").length;
    const claimed = recipients.filter((r) => r.status === "claimed").length;

    return {
      total,
      waiting,
      verified,
      claimed,
      // Mock trends for the "Strategy Minimalism" UI
      trends: {
        waiting: { value: "+2", isUp: true },
        verified: { value: "+5", isUp: true },
        claimed: { value: "88%", isRate: true },
      },
      // Breakdown for the progress bars inside cards
      breakdown: {
        waitingRate: (waiting / total) * 100,
        verifiedRate: (verified / total) * 100,
        claimedRate: (claimed / total) * 100,
      }
    };
  }, [recipients]);

  const selectRecipient = (id: string) => {
    const newSelected = new Set(selectedRecipientIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRecipientIds(newSelected);
  };

  const selectAll = () => {
    if (selectedRecipientIds.size === filteredRecipients.length) {
      setSelectedRecipientIds(new Set());
    } else {
      setSelectedRecipientIds(new Set(filteredRecipients.map((r) => r.id)));
    }
  };

  const deleteSelected = () => {
    setRecipients(recipients.filter((r) => !selectedRecipientIds.has(r.id)));
    setSelectedRecipientIds(new Set());
  };

  const updateRecipientTags = (id: string, tags: string[]) => {
    setRecipients(
      recipients.map((r) => (r.id === id ? { ...r, tags, updatedAt: new Date().toISOString() } : r))
    );
  };

  const updateRecipientInfo = (id: string, info: { name: string; listenerNote?: string }) => {
    setRecipients(
      recipients.map((r) =>
        r.id === id
          ? { ...r, ...info, updatedAt: new Date().toISOString() }
          : r
      )
    );
  };

  const bulkUpdateTags = (ids: Set<string>, tags: string[], mode: "add" | "replace" = "add") => {
    setRecipients(
      recipients.map((r) => {
        if (!ids.has(r.id)) return r;
        const newTags =
          mode === "replace" ? tags : Array.from(new Set([...r.tags, ...tags]));
        return { ...r, tags: newTags, updatedAt: new Date().toISOString() };
      })
    );
  };

  const allUniqueTags = useMemo(() => {
    const tags = new Set<string>();
    recipients.forEach((r) => r.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [recipients]);

  const addRecipient = (name: string = "新規受取人") => {
    const newId = Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();
    const newRecipient: Recipient = {
      id: newId,
      name,
      status: "waiting",
      tags: [],
      createdAt: now,
      updatedAt: now,
    };
    setRecipients([newRecipient, ...recipients]);
    return newRecipient;
  };

  return {
    recipients: filteredRecipients,
    allUniqueTags,
    stats,
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
  };
}
