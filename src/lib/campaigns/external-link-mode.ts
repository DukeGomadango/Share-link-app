import type { campaigns } from "@/db/schema";

export const EXTERNAL_LINK_SECURITY_LEVEL = "high" as const;
export const EXTERNAL_LINK_DISTRIBUTION_MODE = "reception" as const;

type CampaignRow = Pick<
  typeof campaigns.$inferSelect,
  "securityLevel" | "distributionMode" | "status" | "isExternalLinked" | "gachaConfig"
>;

/** だんごツール連携中に固定する配布設定 */
export function externalLinkLockedCampaignFields(): {
  securityLevel: typeof EXTERNAL_LINK_SECURITY_LEVEL;
  distributionMode: typeof EXTERNAL_LINK_DISTRIBUTION_MODE;
  status: "active";
} {
  return {
    securityLevel: EXTERNAL_LINK_SECURITY_LEVEL,
    distributionMode: EXTERNAL_LINK_DISTRIBUTION_MODE,
    status: "active",
  };
}

/** 連携 ON 時に DB へ反映するパッチ（UI・API 共通） */
export function patchForEnablingExternalLink() {
  return {
    isExternalLinked: true,
    ...externalLinkLockedCampaignFields(),
  };
}

/** 連携中は公開/限定・配布方式を変えられない */
export function rejectsExternalLinkLockedFieldChange(
  campaign: CampaignRow,
  body: { securityLevel?: string; distributionMode?: string }
): string | null {
  if (!campaign.isExternalLinked) {
    return null;
  }
  if (
    body.securityLevel !== undefined &&
    body.securityLevel !== EXTERNAL_LINK_SECURITY_LEVEL
  ) {
    return "ツール連携中は限定配布（パスキー必須）に固定されています。連携を一時停止してから変更してください。";
  }
  if (
    body.distributionMode !== undefined &&
    body.distributionMode !== EXTERNAL_LINK_DISTRIBUTION_MODE
  ) {
    return "ツール連携中は共通受付配布に固定されています。連携を一時停止してから変更してください。";
  }
  return null;
}

/** 一度でもガチャ構成を保存したか（一時停止後の「再開」判定） */
export function hasGachaConfigHistory(
  gachaConfig: CampaignRow["gachaConfig"]
): boolean {
  return Boolean(
    gachaConfig &&
      typeof gachaConfig === "object" &&
      "rarities" in gachaConfig &&
      Array.isArray((gachaConfig as { rarities?: unknown[] }).rarities) &&
      ((gachaConfig as { rarities: unknown[] }).rarities.length ?? 0) > 0
  );
}
