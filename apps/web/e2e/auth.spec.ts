import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should display login page", async ({ page }) => {
    await page.goto("/auth/login");

    await expect(page.locator("h1")).toContainText("Xat");
    await expect(page.locator("text=Sign in to your account")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText("Sign in");
  });

  test("should display register page", async ({ page }) => {
    await page.goto("/auth/register");

    await expect(page.locator("h1")).toContainText("Xat");
    await expect(page.locator("text=Create your account")).toBeVisible();
    await expect(page.locator("#accountName")).toBeVisible();
    await expect(page.locator("#name")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText("Create account");
  });

  test("should navigate between login and register", async ({ page }) => {
    await page.goto("/auth/login");

    await page.click("text=Create one");
    await expect(page).toHaveURL(/\/auth\/register/);

    await page.click("text=Sign in");
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("should redirect unauthenticated users from app to login", async ({ page }) => {
    await page.goto("/app/conversations");

    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("should show error for invalid login credentials", async ({ page }) => {
    await page.goto("/auth/login");

    await page.fill("#email", "nonexistent@example.com");
    await page.fill("#password", "wrongpassword");
    await page.click('button[type="submit"]');

    // Should stay on login page and show error
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.locator(".bg-red-50")).toBeVisible();
  });

  test("should validate required fields on register", async ({ page }) => {
    await page.goto("/auth/register");

    // Try submitting empty form - browser validation should prevent it
    await page.click('button[type="submit"]');

    // Should stay on register page
    await expect(page).toHaveURL(/\/auth\/register/);
  });
});
