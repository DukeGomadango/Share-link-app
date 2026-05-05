import { useState, useMemo, useEffect, useCallback } from "react";
import type { Recipient, RecipientFilter } from "@/components/features/campaigns/types";

export function useRecipients() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<RecipientFilter>("all");
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<Set<string>>(new Set());

  const fetchRecipients = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/recipients");
      if (res.ok) {
        const data = await res.json();
        setRecipients(data);
      }
    } catch (e) {
      console.error("Failed to fetch recipients:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipients();
  }, [fetchRecipients]);

  const filteredRecipients = useMemo(() => {
    return recipients.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.platformId?.handle.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "noTags" && r.tags.length === 0) ||
        (activeFilter === "verified" ? r.passkeyVerified : activeFilter === r.status);

      return matchesSearch && matchesFilter;
    });
  }, [recipients, searchQuery, activeFilter]);

  const stats = useMemo(() => {
    const total = recipients.length;
    const waiting = recipients.filter((r) => r.status === "waiting").length;
    const verified = recipients.filter((r) => r.passkeyVerified).length;
    const claimed = recipients.filter((r) => r.status === "claimed").length;

    return {
      total,
      waiting,
      verified,
      claimed,
      // Mock trends for now, could be improved with real data history
      trends: {
        waiting: { value: "0", isUp: true },
        verified: { value: "0", isUp: true },
        claimed: { value: total > 0 ? `${Math.round((claimed / total) * 100)}%` : "0%", isRate: true },
      },
      breakdown: {
        waitingRate: total > 0 ? (waiting / total) * 100 : 0,
        verifiedRate: total > 0 ? (verified / total) * 100 : 0,
        claimedRate: total > 0 ? (claimed / total) * 100 : 0,
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
    if (selectedRecipientIds.size === filteredRecipients.length && filteredRecipients.length > 0) {
      setSelectedRecipientIds(new Set());
    } else {
      setSelectedRecipientIds(new Set(filteredRecipients.map((r) => r.id)));
    }
  };

  const deleteSelected = async () => {
    const ids = Array.from(selectedRecipientIds);
    if (ids.length === 0) return;

    if (!window.confirm(`${ids.length}件の受取人を削除してもよろしいですか？`)) return;

    // Sequential delete for simplicity, could be bulk API
    for (const id of ids) {
      try {
        await fetch(`/api/recipients/${id}`, { method: "DELETE" });
      } catch (e) {
        console.error(`Failed to delete recipient ${id}:`, e);
      }
    }
    setSelectedRecipientIds(new Set());
    fetchRecipients();
  };

  const deleteRecipient = async (id: string) => {
    try {
      await fetch(`/api/recipients/${id}`, { method: "DELETE" });
      setRecipients(prev => prev.filter(r => r.id !== id));
      setSelectedRecipientIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (e) {
      console.error(`Failed to delete recipient ${id}:`, e);
    }
  };

  const updateRecipientTags = async (id: string, tags: string[]) => {
    try {
      const res = await fetch(`/api/recipients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags }),
      });
      if (res.ok) {
        const data = await res.json();
        setRecipients(data);
      }
    } catch (e) {
      console.error("Failed to update tags:", e);
    }
  };

  const updateRecipientInfo = async (id: string, info: { name: string; platformId?: any; listenerNote?: string }) => {
    try {
      const res = await fetch(`/api/recipients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(info),
      });
      if (res.ok) {
        const data = await res.json();
        setRecipients(data);
      }
    } catch (e) {
      console.error("Failed to update info:", e);
    }
  };

  const bulkUpdateTags = async (ids: Set<string>, tags: string[], mode: "add" | "replace" = "add") => {
    // Implement bulk update via multiple PATCH calls or create a bulk API
    const idArray = Array.from(ids);
    for (const id of idArray) {
      const recipient = recipients.find(r => r.id === id);
      if (!recipient) continue;
      
      const newTags = mode === "replace" ? tags : Array.from(new Set([...recipient.tags, ...tags]));
      await updateRecipientTags(id, newTags);
    }
    fetchRecipients();
  };

  const bulkAddRecipients = async (data: any[]) => {
    try {
      const res = await fetch("/api/recipients/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients: data }),
      });
      if (res.ok) {
        fetchRecipients();
        return true;
      }
    } catch (e) {
      console.error("Failed to bulk add recipients:", e);
    }
    return false;
  };

  const allUniqueTags = useMemo(() => {
    const tags = new Set<string>();
    recipients.forEach((r) => r.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [recipients]);

  const addRecipient = async (name: string = "新規受取人") => {
    try {
      const res = await fetch("/api/recipients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const newRecipient = await res.json();
        setRecipients([newRecipient, ...recipients]);
        return newRecipient;
      }
    } catch (e) {
      console.error("Failed to add recipient:", e);
    }
    return null;
  };

  return {
    recipients: filteredRecipients,
    isLoading,
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
    deleteRecipient,
    updateRecipientTags,
    updateRecipientInfo,
    addRecipient,
    bulkUpdateTags,
    bulkAddRecipients,
  };
}
