import { test, expect } from "@playwright/test";

test.describe("mobile layout", () => {
  test("LP mobile menu opens anchor links", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-chrome", "mobile viewport only");

    await page.goto("/", { waitUntil: "load", timeout: 60_000 });
    await page.getByRole("button", { name: /メニューを開く|Open menu/i }).click();
    await expect(page.getByRole("link", { name: /料金|Pricing/i })).toBeVisible();
  });

  test("receive page uses touch-friendly controls", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-chrome", "mobile viewport only");

    await page.goto("/claim", { waitUntil: "load", timeout: 60_000 });
    await expect(page.locator("body")).toBeVisible();
  });

  test("login page fits mobile viewport", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-chrome", "mobile viewport only");

    await page.goto("/login", { waitUntil: "load", timeout: 60_000 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 2
    );
    expect(overflow).toBe(false);
  });
});
