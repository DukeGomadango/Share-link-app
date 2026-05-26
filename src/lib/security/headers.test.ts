import { afterEach, describe, expect, it, vi } from "vitest";

import { buildContentSecurityPolicy } from "./headers";

describe("buildContentSecurityPolicy", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not allow unsafe-eval in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(buildContentSecurityPolicy()).not.toContain("'unsafe-eval'");
  });

  it("keeps unsafe-eval outside production for Next dev tooling", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(buildContentSecurityPolicy()).toContain("'unsafe-eval'");
  });
});
