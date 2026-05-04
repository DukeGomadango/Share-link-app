export type FileItem = {
  id: string;
  name: string;
  type: "audio" | "image";
  previewUrl?: string;
};

export type RecipientStatus = "waiting" | "verified" | "claimed";

export type WorkflowRecipient = {
  id: string;
  name: string;
  tags: string[];
  status: RecipientStatus;
  platformId?: {
    type: "discord" | "twitter" | "custom";
    handle: string;
  };
  createdAt: string;
  updatedAt: string;
  /** 受付チェックイン時の識別用メモ */
  listenerNote?: string;
  streamerMemo?: string;
  assignedFileIds?: string[];
  link?: string;
  claimSecret?: string;
  /** パスキー登録により本人確認済み（補助情報） */
  passkeyVerified?: boolean;
};

/** @deprecated WorkflowRecipient を優先（後方互換の別名） */
export type Recipient = WorkflowRecipient;

export type SlotStatus = "unlinked" | "ready" | "issued";

export type CampaignRecipientSlot = {
  id: string;
  campaignId: string;
  recipientId?: string; // Optional: can be an empty slot
  recipient?: Recipient; // Joined data
  campaignAssetId?: string; // Optional: not yet linked to a file
  status: SlotStatus;
  createdAt: string;
};

export type LibraryFile = {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
  url: string;
  linkedCampaigns: string[];
};

export type DistributionMode = "per_link" | "reception";

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  status: "active" | "draft" | "completed";
  type: string;
  createdAt: string;
  expiresAt?: string;
  securityLevel: "standard" | "high" | "paranoid";
  useOtp: boolean;
  /** `reception` のとき共通受付 URL（チェックイン）を使う */
  distributionMode?: DistributionMode;
  /** 受付ページ `/receive/[token]` 用（サーバが初回アクセス時に生成することあり） */
  publicReceptionToken?: string;
  stats: {
    totalFiles: number;
    assignedRecipients: number;
    openRate: number;
  };
  slots?: CampaignRecipientSlot[];
}

export type QuickFilter = "all" | "needsAttention" | "dueSoon" | Campaign["status"];
export type RecipientFilter = "all" | "noTags" | RecipientStatus;
export type ViewMode = "list" | "kanban";
