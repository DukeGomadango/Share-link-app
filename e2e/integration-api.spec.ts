import { test, expect } from "@playwright/test";

const token = process.env.E2E_INTEGRATION_TOKEN?.trim();
const apiBase = (process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3099").replace(
  /\/$/,
  ""
);

test.describe("external API smoke", () => {
  test.skip(!token, "E2E_INTEGRATION_TOKEN が未設定のためスキップ");

  test("GET /api/v1/external/campaigns returns 200", async ({ request }) => {
    const res = await request.get(`${apiBase}/api/v1/external/campaigns`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });
});
