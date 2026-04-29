"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LibraryFiltersProps {
  filter: string;
  setFilter: (filter: string) => void;
  selectedCount: number;
  campaignsCount: number;
  onClearSelection: () => void;
  onOpenAssignModal: () => void;
  labels: {
    filterType: string;
    fileType: {
      all: string;
      image: string;
      audio: string;
    };
    clearSelection: string;
    assignToCampaign: string;
  };
}

export function LibraryFilters({
  filter,
  setFilter,
  selectedCount,
  campaignsCount,
  onClearSelection,
  onOpenAssignModal,
  labels,
}: LibraryFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-sm font-medium mr-2">{labels.filterType}:</span>
      <Button
        variant={filter === "all" ? "default" : "outline"}
        size="sm"
        onClick={() => setFilter("all")}
        className={filter === "all" ? "bg-emerald-500 text-white" : ""}
      >
        {labels.fileType.all}
      </Button>
      <Button
        variant={filter === "image" ? "default" : "outline"}
        size="sm"
        onClick={() => setFilter("image")}
        className={filter === "image" ? "bg-emerald-500 text-white" : ""}
      >
        {labels.fileType.image}
      </Button>
      <Button
        variant={filter === "audio" ? "default" : "outline"}
        size="sm"
        onClick={() => setFilter("audio")}
        className={filter === "audio" ? "bg-emerald-500 text-white" : ""}
      >
        {labels.fileType.audio}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onClearSelection}
        disabled={selectedCount === 0}
      >
        {labels.clearSelection}
      </Button>
      <Button
        size="sm"
        className="bg-emerald-500 text-white hover:bg-emerald-600"
        disabled={selectedCount === 0 || campaignsCount === 0}
        onClick={onOpenAssignModal}
      >
        <Plus className="w-3.5 h-3.5 mr-1" />
        {labels.assignToCampaign} ({selectedCount})
      </Button>
    </div>
  );
}
