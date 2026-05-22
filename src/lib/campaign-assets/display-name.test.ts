import { describe, expect, it } from "vitest";
import { resolveCampaignAssetDisplayName, CAMPAIGN_ASSET_UNTITLED } from "./display-name";

describe("resolveCampaignAssetDisplayName", () => {
  it("prefers label when set", () => {
    expect(
      resolveCampaignAssetDisplayName({
        label: "  カスタム名  ",
        libraryOriginalFilename: "file.png",
      })
    ).toBe("カスタム名");
  });

  it("falls back to library originalFilename", () => {
    expect(
      resolveCampaignAssetDisplayName({
        label: null,
        libraryOriginalFilename: "テスト 1.png",
      })
    ).toBe("テスト 1.png");
  });

  it("returns untitled when nothing available", () => {
    expect(resolveCampaignAssetDisplayName({})).toBe(CAMPAIGN_ASSET_UNTITLED);
  });
});
