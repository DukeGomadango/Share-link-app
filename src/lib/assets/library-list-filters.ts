export type AssetMimeCategory = "image" | "audio";
export type AssetSizeFilter = "small" | "medium" | "large";
export type AssetDateFilter = "7d" | "30d" | "90d";

export type AssetListFilters = {
  q?: string;
  mimeCategory?: AssetMimeCategory;
  unassignedOnly?: boolean;
  size?: AssetSizeFilter;
  date?: AssetDateFilter;
  /** smartTags の値（image / audio / large / unassigned / 拡張子など） */
  tag?: string;
};

export function serializeAssetListFilters(filters: AssetListFilters): URLSearchParams {
  const params = new URLSearchParams();
  const q = filters.q?.trim();
  if (q) params.set("q", q);
  if (filters.mimeCategory) params.set("type", filters.mimeCategory);
  if (filters.unassignedOnly) params.set("unassigned", "1");
  if (filters.size) params.set("size", filters.size);
  if (filters.date) params.set("date", filters.date);
  if (filters.tag && filters.tag !== "all") params.set("tag", filters.tag);
  return params;
}

export function parseAssetListFilters(searchParams: URLSearchParams): AssetListFilters {
  const filters: AssetListFilters = {};
  const q = searchParams.get("q")?.trim();
  if (q) filters.q = q;

  const type = searchParams.get("type");
  if (type === "image" || type === "audio") {
    filters.mimeCategory = type;
  }

  if (searchParams.get("unassigned") === "1") {
    filters.unassignedOnly = true;
  }

  const size = searchParams.get("size");
  if (size === "small" || size === "medium" || size === "large") {
    filters.size = size;
  }

  const date = searchParams.get("date");
  if (date === "7d" || date === "30d" || date === "90d") {
    filters.date = date;
  }

  const tag = searchParams.get("tag")?.trim();
  if (tag && tag !== "all") {
    filters.tag = tag;
  }

  return filters;
}

export function filtersAreActive(filters: AssetListFilters): boolean {
  return !!(
    filters.q?.trim() ||
    filters.mimeCategory ||
    filters.unassignedOnly ||
    filters.size ||
    filters.date ||
    (filters.tag && filters.tag !== "all")
  );
}
