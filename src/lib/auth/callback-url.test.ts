import { describe, expect, it } from "vitest";

import { normalizeAuthNextPath } from "./callback-url";

describe("normalizeAuthNextPath", () => {
  it("allows app-relative paths", () => {
    expect(normalizeAuthNextPath("/dashboard?tab=files")).toBe("/dashboard?tab=files");
  });

  it("rejects absolute and protocol-relative URLs", () => {
    expect(normalizeAuthNextPath("https://evil.example")).toBe("/dashboard");
    expect(normalizeAuthNextPath("//evil.example/path")).toBe("/dashboard");
  });

  it("rejects empty or control-character values", () => {
    expect(normalizeAuthNextPath("")).toBe("/dashboard");
    expect(normalizeAuthNextPath("/dash\nboard")).toBe("/dashboard");
  });
});
