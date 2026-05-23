import { test, expect } from "@playwright/test";

test.describe("GET /api/health", () => {
  test("returns structured checks (contract)", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBeLessThan(600);
    const body = (await res.json()) as {
      ok?: boolean;
      checks?: Record<string, boolean>;
      database?: { ok: boolean; error?: string };
      integration?: { externalCorsConfigured?: boolean; cronConfigured?: boolean };
    };
    expect(body).toHaveProperty("checks");
    expect(body).toHaveProperty("database");
    expect(typeof body.checks?.DATABASE_URL).toBe("boolean");
  });

  test("full stack healthy when E2E_FULL_STACK=1", async ({ request }) => {
    test.skip(
      process.env.E2E_FULL_STACK !== "1",
      "ローカル .env.local または CI secrets で E2E_FULL_STACK=1 を指定"
    );
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { ok: boolean; database: { ok: boolean } };
    expect(body.ok).toBe(true);
    expect(body.database.ok).toBe(true);
  });
});
