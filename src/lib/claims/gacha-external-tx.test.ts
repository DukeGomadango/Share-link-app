import { describe, expect, it } from "vitest";

import { isGachaExternalTransactionId } from "./gacha-external-tx";

describe("isGachaExternalTransactionId", () => {
  it("returns true for gacha- prefixed ids", () => {
    expect(isGachaExternalTransactionId("gacha-pool1-player-abc")).toBe(true);
  });

  it("returns false for reception recv- ids", () => {
    expect(isGachaExternalTransactionId("recv-550e8400-e29b-41d4-a716-446655440000")).toBe(
      false
    );
  });

  it("returns false for empty or unrelated strings", () => {
    expect(isGachaExternalTransactionId("")).toBe(false);
    expect(isGachaExternalTransactionId("player-1")).toBe(false);
  });
});
