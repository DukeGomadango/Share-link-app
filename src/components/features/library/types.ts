export interface AssetFile {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
  url: string;
  linkedCampaigns: string[];
}

export interface CampaignSummary {
  id: string;
  name: string;
}

export interface UndoAssignmentPayload {
  linksByFileId: Record<string, string[]>;
}

export interface AssignResult {
  added: number;
  skipped: number;
  campaignName: string;
}
