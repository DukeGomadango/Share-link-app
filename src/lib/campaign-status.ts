import type { Campaign } from "@/components/features/campaigns/types";

export type DbCampaignStatus = "draft" | "active" | "archived";

export function uiStatusFromDb(status: DbCampaignStatus): Campaign["status"] {
  return status === "archived" ? "completed" : status;
}

export function dbStatusFromUi(status: Campaign["status"]): DbCampaignStatus {
  return status === "completed" ? "archived" : status;
}
