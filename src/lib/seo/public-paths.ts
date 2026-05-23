/** 検索エンジンにインデックスさせる公開パス（sitemap と robots allow の根拠） */
export const INDEXABLE_PATHS = ["/", "/use-cases", "/privacy-policy", "/terms"] as const;

export type IndexablePath = (typeof INDEXABLE_PATHS)[number];
