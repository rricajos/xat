import { test, expect } from "@playwright/test";

test.describe("Contacts Page", () => {
  test("should redirect to login if not authenticated", async ({ page }) => {
    await page.goto("/app/contacts");
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

test.describe("Contacts - Public API", () => {
  test("GET /api/v1/contacts should require auth", async ({ request }) => {
    const response = await request.get("/api/v1/contacts");
    expect(response.status()).toBe(401);
  });

  test("POST /api/v1/contacts should require auth", async ({ request }) => {
    const response = await request.post("/api/v1/contacts", {
      data: { name: "Test" },
    });
    expect(response.status()).toBe(401);
  });
});
