import { test, expect } from "@playwright/test";

/** 認証不要で安定して開ける公開ルート */
const PUBLIC_PATHS = ["/login", "/register", "/claim"] as const;

test.describe("public pages", () => {
  for (const pathname of PUBLIC_PATHS) {
    test(`loads ${pathname}`, async ({ page }) => {
      const res = await page.goto(pathname, { waitUntil: "load", timeout: 60_000 });
      expect(res, `response for ${pathname}`).not.toBeNull();
      expect(res!.status(), `HTTP status for ${pathname}`).toBeLessThan(400);
      await expect(page.locator("body")).toBeVisible();
    });
  }

  test("protected route redirects to login", async ({ page }) => {
    await page.goto("/campaigns/new", { waitUntil: "load" });
    await expect(page).toHaveURL(/\/login/);
  });
});
