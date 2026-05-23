import { describe, expect, it } from "vitest";

import {
  EXTERNAL_LINK_DISTRIBUTION_MODE,
  EXTERNAL_LINK_SECURITY_LEVEL,
  externalLinkLockedCampaignFields,
  hasGachaConfigHistory,
  patchForEnablingExternalLink,
  rejectsExternalLinkLockedFieldChange,
} from "./external-link-mode";

describe("externalLinkLockedCampaignFields", () => {
  it("locks high security and reception distribution", () => {
    expect(externalLinkLockedCampaignFields()).toEqual({
      securityLevel: "high",
      distributionMode: "reception",
      status: "active",
    });
    expect(EXTERNAL_LINK_SECURITY_LEVEL).toBe("high");
    expect(EXTERNAL_LINK_DISTRIBUTION_MODE).toBe("reception");
  });
});

describe("patchForEnablingExternalLink", () => {
  it("enables external link flag with locked fields", () => {
    expect(patchForEnablingExternalLink()).toEqual({
      isExternalLinked: true,
      securityLevel: "high",
      distributionMode: "reception",
      status: "active",
    });
  });
});

describe("rejectsExternalLinkLockedFieldChange", () => {
  const linked = {
    isExternalLinked: true,
    securityLevel: "high" as const,
    distributionMode: "reception" as const,
    status: "active" as const,
    gachaConfig: null,
  };

  it("allows changes when not externally linked", () => {
    expect(
      rejectsExternalLinkLockedFieldChange(
        { ...linked, isExternalLinked: false },
        { distributionMode: "per_link" }
      )
    ).toBeNull();
  });

  it("rejects security level change while linked", () => {
    expect(
      rejectsExternalLinkLockedFieldChange(linked, { securityLevel: "standard" })
    ).toContain("限定配布");
  });

  it("rejects distribution mode change while linked", () => {
    expect(
      rejectsExternalLinkLockedFieldChange(linked, { distributionMode: "per_link" })
    ).toContain("共通受付");
  });
});

describe("hasGachaConfigHistory", () => {
  it("detects saved rarities", () => {
    expect(
      hasGachaConfigHistory({
        rarities: [{ id: "r1", name: "N", probability: 100, color: "#fff" }],
      })
    ).toBe(true);
  });

  it("returns false for empty config", () => {
    expect(hasGachaConfigHistory(null)).toBe(false);
    expect(hasGachaConfigHistory({ rarities: [] })).toBe(false);
  });
});
