export type FileItem = {
  id: string;
  name: string;
  type: "audio" | "image" | "file";
  previewUrl?: string;
  /** 元のライブラリアセットID（紐付いている場合） */
  libraryAssetId?: string;
  expiresAt?: string;
  /** ガチャ連携時のレアリティID */
  gachaRarityId?: string;
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
  /** グローバルな受取人 ID（紐付いている場合） */
  globalRecipientId?: string;
  /** 外部連携の冪等 ID（ガチャ: `gacha-{poolId}-player-{playerId}` 等） */
  externalTransactionId?: string;
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
  expiresAt?: string;
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
  securityLevel: "standard" | "high";
  /** `reception` のとき共通受付 URL（チェックイン）を使う */
  distributionMode?: DistributionMode;
  /** 受付ページ `/receive/[token]` 用（サーバが初回アクセス時に生成することあり） */
  publicReceptionToken?: string;
  /** ガチャ等の外部連携が行われているか（公開設定をロックする） */
  isExternalLinked?: boolean;
  /** ガチャ連携用の構成（レアリティごとの確率設定など） */
  gachaConfig?: {
    rarities: { id: string; name: string; probability: number; color: string }[];
  };
  stats: {
    totalFiles: number;
    assignedRecipients: number;
    openRate: number;
  };
  slots?: CampaignRecipientSlot[];
  topAssetUrls?: string[];
}

export type QuickFilter = "all" | "needsAttention" | "dueSoon" | Campaign["status"];
export type RecipientFilter = "all" | "noTags" | RecipientStatus;
export type ViewMode = "list" | "kanban";
