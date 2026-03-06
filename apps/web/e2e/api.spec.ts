import { test, expect } from "@playwright/test";

test.describe("API Endpoints - Authentication", () => {
  test("GET /api/v1/contacts should require auth", async ({ request }) => {
    const response = await request.get("/api/v1/contacts");
    expect(response.status()).toBe(401);
  });

  test("GET /api/v1/companies should require auth", async ({ request }) => {
    const response = await request.get("/api/v1/companies");
    expect(response.status()).toBe(401);
  });

  test("POST /api/v1/contacts/merge should require auth", async ({ request }) => {
    const response = await request.post("/api/v1/contacts/merge", {
      data: { primaryContactId: 1, secondaryContactId: 2 },
    });
    expect(response.status()).toBe(401);
  });
});

test.describe("API Endpoints - Channel Webhooks", () => {
  test("GET /api/v1/channels/telegram/webhook should return ok", async ({ request }) => {
    const response = await request.get("/api/v1/channels/telegram/webhook");
    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json.status).toBe("ok");
  });

  test("POST /api/v1/channels/telegram/webhook without token should return 400", async ({ request }) => {
    const response = await request.post("/api/v1/channels/telegram/webhook", {
      data: {},
    });
    expect(response.status()).toBe(400);
  });

  test("POST /api/v1/channels/sms/webhook with empty data should return TwiML", async ({ request }) => {
    const response = await request.post("/api/v1/channels/sms/webhook", {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      data: "",
    });
    // SMS webhook always returns TwiML
    expect(response.headers()["content-type"]).toContain("text/xml");
  });
});
