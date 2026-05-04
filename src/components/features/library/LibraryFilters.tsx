"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LibraryFiltersProps {
  fileTypeFilter: "all" | "image" | "audio";
  onFileTypeFilterChange: (filter: "all" | "image" | "audio") => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  unassignedOnly: boolean;
  onUnassignedOnlyChange: (next: boolean) => void;
  sizeFilter: "all" | "small" | "medium" | "large";
  onSizeFilterChange: (next: "all" | "small" | "medium" | "large") => void;
  dateFilter: "all" | "7d" | "30d" | "90d";
  onDateFilterChange: (next: "all" | "7d" | "30d" | "90d") => void;
  selectedTag: string;
  smartTags: string[];
  onSelectedTagChange: (next: string) => void;
  selectedCount: number;
  campaignsCount: number;
  onClearSelection: () => void;
  onOpenAssignModal: () => void;
  onBulkDelete: () => void;
  onOpenCommandDrop: () => void;
  labels: {
    searchPlaceholder: string;
    filtersLabel: string;
    unassignedOnly: string;
    sizeLabel: string;
    dateLabel: string;
    tagLabel: string;
    dateOptions: {
      all: string;
      d7: string;
      d30: string;
      d90: string;
    };
    sizeOptions: {
      all: string;
      small: string;
      medium: string;
      large: string;
    };
    fileType: {
      all: string;
      image: string;
      audio: string;
    };
    openCommandDrop: string;
    clearSelection: string;
    assignToCampaign: string;
    deleteSelected: string;
  };
}

export function LibraryFilters({
  fileTypeFilter,
  onFileTypeFilterChange,
  searchQuery,
  onSearchQueryChange,
  unassignedOnly,
  onUnassignedOnlyChange,
  sizeFilter,
  onSizeFilterChange,
  dateFilter,
  onDateFilterChange,
  selectedTag,
  smartTags,
  onSelectedTagChange,
  selectedCount,
  campaignsCount,
  onClearSelection,
  onOpenAssignModal,
  onBulkDelete,
  onOpenCommandDrop,
  labels,
}: LibraryFiltersProps) {
  return (
    <div className="space-y-3 mb-4">
      <input
        value={searchQuery}
        onChange={(event) => onSearchQueryChange(event.target.value)}
        placeholder={labels.searchPlaceholder}
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
      />
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium mr-2">{labels.filtersLabel}</span>
        <label className="text-sm flex items-center gap-2 border border-border rounded-md px-2 py-1">
          <input
            type="checkbox"
            checked={unassignedOnly}
            onChange={(event) => onUnassignedOnlyChange(event.target.checked)}
          />
          {labels.unassignedOnly}
        </label>
        <select
          value={sizeFilter}
          onChange={(event) => onSizeFilterChange(event.target.value as "all" | "small" | "medium" | "large")}
          className="text-sm bg-background border border-border rounded-md px-2 py-1"
        >
          <option value="all">{labels.sizeLabel}: {labels.sizeOptions.all}</option>
          <option value="small">{labels.sizeLabel}: {labels.sizeOptions.small}</option>
          <option value="medium">{labels.sizeLabel}: {labels.sizeOptions.medium}</option>
          <option value="large">{labels.sizeLabel}: {labels.sizeOptions.large}</option>
        </select>
        <select
          value={dateFilter}
          onChange={(event) => onDateFilterChange(event.target.value as "all" | "7d" | "30d" | "90d")}
          className="text-sm bg-background border border-border rounded-md px-2 py-1"
        >
          <option value="all">{labels.dateLabel}: {labels.dateOptions.all}</option>
          <option value="7d">{labels.dateLabel}: {labels.dateOptions.d7}</option>
          <option value="30d">{labels.dateLabel}: {labels.dateOptions.d30}</option>
          <option value="90d">{labels.dateLabel}: {labels.dateOptions.d90}</option>
        </select>
        <select
          value={selectedTag}
          onChange={(event) => onSelectedTagChange(event.target.value)}
          className="text-sm bg-background border border-border rounded-md px-2 py-1 max-w-[220px]"
        >
          <option value="all">{labels.tagLabel}: {labels.fileType.all}</option>
          {smartTags.map((tag) => (
            <option key={tag} value={tag}>{labels.tagLabel}: {tag}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={fileTypeFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => onFileTypeFilterChange("all")}
          className={fileTypeFilter === "all" ? "bg-emerald-500 text-white" : ""}
        >
          {labels.fileType.all}
        </Button>
        <Button
          variant={fileTypeFilter === "image" ? "default" : "outline"}
          size="sm"
          onClick={() => onFileTypeFilterChange("image")}
          className={fileTypeFilter === "image" ? "bg-emerald-500 text-white" : ""}
        >
          {labels.fileType.image}
        </Button>
        <Button
          variant={fileTypeFilter === "audio" ? "default" : "outline"}
          size="sm"
          onClick={() => onFileTypeFilterChange("audio")}
          className={fileTypeFilter === "audio" ? "bg-emerald-500 text-white" : ""}
        >
          {labels.fileType.audio}
        </Button>
        <Button variant="outline" size="sm" onClick={onOpenCommandDrop} disabled={selectedCount === 0}>
          {labels.openCommandDrop}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearSelection}
          disabled={selectedCount === 0}
        >
          {labels.clearSelection}
        </Button>
        
        {selectedCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkDelete}
            className="text-red-500 hover:text-red-600 border-red-200 hover:bg-red-50"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            {labels.deleteSelected} ({selectedCount})
          </Button>
        )}

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
    </div>
  );
}
