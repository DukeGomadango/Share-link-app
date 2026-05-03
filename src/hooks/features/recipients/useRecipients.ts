import { useState, useMemo } from "react";
import type { Recipient, RecipientFilter } from "@/components/features/campaigns/types";

const MOCK_RECIPIENTS: Recipient[] = [
  {
    id: "1",
    name: "山田 太郎",
    email: "yamada@example.com",
    tags: ["VIP", "Streamer"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "佐藤 花子",
    email: "sato@example.com",
    tags: ["Normal"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "鈴木 一郎",
    tags: ["Twitter"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "4",
    name: "田中 次郎",
    email: "tanaka@example.com",
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
        r.email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "noEmail" && !r.email) ||
        (activeFilter === "noTags" && r.tags.length === 0);

      return matchesSearch && matchesFilter;
    });
  }, [recipients, searchQuery, activeFilter]);

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

  return {
    recipients: filteredRecipients,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    selectedRecipientIds,
    selectRecipient,
    selectAll,
    deleteSelected,
  };
}
