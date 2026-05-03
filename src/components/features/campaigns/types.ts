export type FileItem = {
  id: string;
  name: string;
  type: "audio" | "image";
  previewUrl?: string;
};

export type Recipient = {
  id: string;
  name: string;
  email?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

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
  stats: {
    totalFiles: number;
    assignedRecipients: number;
    openRate: number;
  };
  slots?: CampaignRecipientSlot[]; // Added slots for campaign detail
}

export type QuickFilter = "all" | "needsAttention" | "dueSoon" | Campaign["status"];
export type RecipientFilter = "all" | "noEmail" | "noTags";
export type ViewMode = "list" | "kanban";
