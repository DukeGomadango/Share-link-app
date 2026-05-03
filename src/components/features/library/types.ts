export interface AssetFile {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
  url: string;
  /** 画像プレビュー用（任意・署名 URL と同一のことが多い） */
  previewUrl?: string;
  linkedCampaigns: string[];
}

export interface CampaignSummary {
  id: string;
  name: string;
}

export interface AssignResult {
  added: number;
  skipped: number;
  campaignName: string;
  campaignId?: string;
}

export interface UnassignSnapshot {
  linksByFileId: Record<string, string[]>;
  campaignId: string;
  assetIds: string[];
}
