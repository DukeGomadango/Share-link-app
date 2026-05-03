export type FileItem = {
  id: string;
  name: string;
  type: "audio" | "image";
  previewUrl?: string;
};

export type Recipient = {
  id: string;
  name: string;
  email: string;
  assignedFileIds: string[];
  link?: string;
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
}

export type QuickFilter = "all" | "needsAttention" | "dueSoon" | Campaign["status"];
export type ViewMode = "list" | "kanban";
