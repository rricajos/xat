import { test, expect } from "@playwright/test";

test.describe("Public pages", () => {
  test("should load the login page without errors", async ({ page }) => {
    const response = await page.goto("/auth/login");
    expect(response?.status()).toBe(200);
  });

  test("should load the register page without errors", async ({ page }) => {
    const response = await page.goto("/auth/register");
    expect(response?.status()).toBe(200);
  });

  test("should return 302 for protected routes when not authenticated", async ({ page }) => {
    const response = await page.goto("/app/conversations", {
      waitUntil: "commit",
    });
    // After redirect, should land on login
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

test.describe("API health", () => {
  test("should return 401 for unauthenticated API calls", async ({ request }) => {
    const response = await request.get("/api/v1/conversations");
    expect(response.status()).toBe(401);
  });

  test("should return 401 for unauthenticated captain API calls", async ({ request }) => {
    const response = await request.post("/api/v1/captain", {
      data: { action: "fix_grammar", text: "test" },
    });
    expect(response.status()).toBe(401);
  });

  test("should handle telegram webhook GET", async ({ request }) => {
    const response = await request.get("/api/v1/channels/telegram/webhook");
    expect(response.status()).toBe(200);
  });

  test("should reject telegram webhook without token", async ({ request }) => {
    const response = await request.post("/api/v1/channels/telegram/webhook", {
      data: {},
    });
    expect(response.status()).toBe(400);
  });

  test("should reject facebook webhook without valid verify token", async ({ request }) => {
    const response = await request.get(
      "/api/v1/channels/facebook/webhook?hub.mode=subscribe&hub.verify_token=invalid&hub.challenge=test",
    );
    expect(response.status()).toBe(403);
  });
});
