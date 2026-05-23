import { vi, describe, expect, it, beforeEach } from "vitest";

import { buildRecipientSlotPayload } from "./recipient-slot-payload";

vi.mock("@/db", () => ({
  getDb: vi.fn(),
}));

vi.mock("@/lib/campaigns/public-reception-token", () => ({
  ensurePublicReceptionToken: vi.fn().mockResolvedValue("public-recv-token"),
}));

vi.mock("@/lib/public-base-url", () => ({
  publicBaseUrlFromRequest: () => "https://share.example.test",
}));

const { getDb } = await import("@/db");

function mockDistributionMode(mode: "reception" | "per_link") {
  vi.mocked(getDb).mockReturnValue({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([{ distributionMode: mode }]),
        }),
      }),
    }),
  } as never);
}

describe("buildRecipientSlotPayload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("includes reception_url for reception campaigns", async () => {
    mockDistributionMode("reception");

    const payload = await buildRecipientSlotPayload(new Request("https://x"), {
      campaignId: "camp-1",
      claimId: "claim-1",
      claimSecret: "secret-1",
      slotId: "slot-1",
      recipientId: "recv-1",
      externalTxId: "gacha-p1-player-1",
      linkedAssetCount: 2,
      slotStatus: "ready",
      resolvedExisting: true,
    });

    expect(payload.delivery_mode).toBe("reception");
    expect(payload.reception_url).toBe(
      "https://share.example.test/receive/public-recv-token"
    );
    expect(payload.claim_url).toBeUndefined();
    expect(payload.resolved_existing).toBe(true);
    expect(payload.slot_id).toBe("slot-1");
  });

  it("includes claim_url for per_link campaigns", async () => {
    mockDistributionMode("per_link");

    const payload = await buildRecipientSlotPayload(new Request("https://x"), {
      campaignId: "camp-1",
      claimId: "claim-1",
      claimSecret: "secret-abc",
      slotId: "slot-1",
      recipientId: null,
      externalTxId: "gacha-p1-player-1",
      linkedAssetCount: 0,
      slotStatus: "unlinked",
      resolvedExisting: false,
    });

    expect(payload.delivery_mode).toBe("per_link");
    expect(payload.claim_url).toBe("https://share.example.test/claim/secret-abc");
    expect(payload.reception_url).toBeUndefined();
    expect(payload.resolved_existing).toBe(false);
  });
});
