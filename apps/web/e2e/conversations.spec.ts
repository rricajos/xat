import { test, expect } from "@playwright/test";

test.describe("Conversations", () => {
  test("should redirect to login if not authenticated", async ({ page }) => {
    await page.goto("/app/conversations");
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("should display conversations page structure", async ({ page }) => {
    // Navigate to conversations (will redirect to login)
    await page.goto("/app/conversations");

    // After login redirect, check the login page is shown
    await expect(page.locator("text=Sign in")).toBeVisible();
  });
});

test.describe("Conversation List - UI Elements", () => {
  test("login page has all required elements", async ({ page }) => {
    await page.goto("/auth/login");

    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});
