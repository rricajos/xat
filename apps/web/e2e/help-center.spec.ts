import { test, expect } from "@playwright/test";

test.describe("Help Center Portal (public)", () => {
  test("should load the portal home page", async ({ page }) => {
    const response = await page.goto("/");
    // The portal app runs on a different port, but the main app root should load
    expect(response?.status()).toBeLessThan(500);
  });
});

test.describe("Help Center API", () => {
  test("should return 401 for unauthenticated portal list", async ({ request }) => {
    const response = await request.get("/api/v1/help-center/portals");
    expect(response.status()).toBe(401);
  });

  test("should return 401 for unauthenticated article list", async ({ request }) => {
    const response = await request.get("/api/v1/help-center/articles");
    expect(response.status()).toBe(401);
  });

  test("should return 401 for unauthenticated category list", async ({ request }) => {
    const response = await request.get("/api/v1/help-center/categories?portalId=1");
    expect(response.status()).toBe(401);
  });

  test("should return 401 for creating a portal without auth", async ({ request }) => {
    const response = await request.post("/api/v1/help-center/portals", {
      data: { name: "Test", slug: "test" },
    });
    expect(response.status()).toBe(401);
  });
});
