import { test, expect } from "@playwright/test";

test.describe("Settings Pages", () => {
  test("should redirect settings pages to login if not authenticated", async ({ page }) => {
    const settingsPages = [
      "/app/settings/account",
      "/app/settings/agents",
      "/app/settings/teams",
      "/app/settings/labels",
      "/app/settings/inboxes",
      "/app/settings/canned-responses",
      "/app/settings/custom-attributes",
      "/app/settings/automation",
      "/app/settings/kanban",
      "/app/settings/companies",
    ];

    for (const path of settingsPages) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/auth\/login/);
    }
  });
});

test.describe("Inbox Creation Page", () => {
  test("should redirect to login if not authenticated", async ({ page }) => {
    await page.goto("/app/settings/inboxes/new");
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
