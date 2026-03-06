import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  updateProfileSchema,
  createAccountSchema,
  createContactSchema,
  createCompanySchema,
  createLabelSchema,
  createCannedResponseSchema,
  createInboxSchema,
  conversationFilterSchema,
  contactFilterSchema,
} from "@xat/shared";

describe("loginSchema", () => {
  it("should accept valid email and password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("should reject short password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "12345",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty email", () => {
    const result = loginSchema.safeParse({
      email: "",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("should accept valid registration data", () => {
    const result = registerSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "secure123",
      accountName: "Acme Corp",
    });
    expect(result.success).toBe(true);
  });

  it("should reject missing account name", () => {
    const result = registerSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "secure123",
      accountName: "",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing name", () => {
    const result = registerSchema.safeParse({
      name: "",
      email: "john@example.com",
      password: "secure123",
      accountName: "Acme Corp",
    });
    expect(result.success).toBe(false);
  });

  it("should reject name longer than 255 characters", () => {
    const result = registerSchema.safeParse({
      name: "a".repeat(256),
      email: "john@example.com",
      password: "secure123",
      accountName: "Acme Corp",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateProfileSchema", () => {
  it("should accept valid profile update", () => {
    const result = updateProfileSchema.safeParse({
      name: "Jane Doe",
      displayName: "Jane",
      availability: 0,
    });
    expect(result.success).toBe(true);
  });

  it("should accept partial updates", () => {
    expect(updateProfileSchema.safeParse({ displayName: "Jane" }).success).toBe(true);
  });

  it("should accept empty object", () => {
    expect(updateProfileSchema.safeParse({}).success).toBe(true);
  });

  it("should reject invalid availability value", () => {
    expect(updateProfileSchema.safeParse({ availability: 5 }).success).toBe(false);
  });

  it("should accept all valid availability values", () => {
    for (const val of [0, 1, 2]) {
      expect(updateProfileSchema.safeParse({ availability: val }).success).toBe(true);
    }
  });
});

describe("createAccountSchema", () => {
  it("should accept valid data with default locale", () => {
    const result = createAccountSchema.safeParse({ name: "My Account" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.locale).toBe("en");
    }
  });

  it("should accept custom locale", () => {
    const result = createAccountSchema.safeParse({ name: "Mi Cuenta", locale: "es" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.locale).toBe("es");
    }
  });

  it("should reject empty name", () => {
    expect(createAccountSchema.safeParse({ name: "" }).success).toBe(false);
  });
});

describe("createContactSchema", () => {
  it("should accept contact with email only", () => {
    expect(createContactSchema.safeParse({ email: "user@test.com" }).success).toBe(true);
  });

  it("should accept contact with name only", () => {
    expect(createContactSchema.safeParse({ name: "John" }).success).toBe(true);
  });

  it("should accept contact with all fields", () => {
    const result = createContactSchema.safeParse({
      name: "John Doe",
      email: "john@test.com",
      phoneNumber: "+1234567890",
      identifier: "ext-123",
      companyId: 5,
    });
    expect(result.success).toBe(true);
  });

  it("should accept empty object (all optional)", () => {
    expect(createContactSchema.safeParse({}).success).toBe(true);
  });

  it("should reject invalid email", () => {
    expect(createContactSchema.safeParse({ email: "not-email" }).success).toBe(false);
  });

  it("should reject negative companyId", () => {
    expect(createContactSchema.safeParse({ companyId: -1 }).success).toBe(false);
  });

  it("should reject non-integer companyId", () => {
    expect(createContactSchema.safeParse({ companyId: 1.5 }).success).toBe(false);
  });
});

describe("createCompanySchema", () => {
  it("should accept valid company", () => {
    const result = createCompanySchema.safeParse({
      name: "Acme Corp",
      domain: "acme.com",
      description: "A company",
    });
    expect(result.success).toBe(true);
  });

  it("should require name", () => {
    expect(createCompanySchema.safeParse({ name: "" }).success).toBe(false);
    expect(createCompanySchema.safeParse({}).success).toBe(false);
  });

  it("should allow name only", () => {
    expect(createCompanySchema.safeParse({ name: "Test" }).success).toBe(true);
  });

  it("should reject description over 2000 chars", () => {
    expect(
      createCompanySchema.safeParse({ name: "Test", description: "a".repeat(2001) }).success,
    ).toBe(false);
  });
});

describe("createLabelSchema", () => {
  it("should accept valid label with defaults", () => {
    const result = createLabelSchema.safeParse({ title: "urgent" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.color).toBe("#1f93ff");
      expect(result.data.showOnSidebar).toBe(true);
    }
  });

  it("should accept custom color", () => {
    expect(createLabelSchema.safeParse({ title: "vip", color: "#ff0000" }).success).toBe(true);
  });

  it("should reject invalid color format", () => {
    expect(createLabelSchema.safeParse({ title: "vip", color: "red" }).success).toBe(false);
    expect(createLabelSchema.safeParse({ title: "vip", color: "#fff" }).success).toBe(false);
    expect(createLabelSchema.safeParse({ title: "vip", color: "#gggggg" }).success).toBe(false);
  });

  it("should reject empty title", () => {
    expect(createLabelSchema.safeParse({ title: "" }).success).toBe(false);
  });

  it("should reject title over 100 chars", () => {
    expect(createLabelSchema.safeParse({ title: "a".repeat(101) }).success).toBe(false);
  });
});

describe("createCannedResponseSchema", () => {
  it("should accept valid canned response", () => {
    const result = createCannedResponseSchema.safeParse({
      shortCode: "greeting",
      content: "Hello! How can I help you?",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty short code", () => {
    expect(
      createCannedResponseSchema.safeParse({ shortCode: "", content: "Hello" }).success,
    ).toBe(false);
  });

  it("should reject empty content", () => {
    expect(
      createCannedResponseSchema.safeParse({ shortCode: "hi", content: "" }).success,
    ).toBe(false);
  });

  it("should reject content over 5000 chars", () => {
    expect(
      createCannedResponseSchema.safeParse({ shortCode: "long", content: "a".repeat(5001) }).success,
    ).toBe(false);
  });
});

describe("createInboxSchema", () => {
  it("should accept all valid channel types", () => {
    const types = [
      "web_widget", "email", "api", "whatsapp", "facebook",
      "instagram", "telegram", "twitter", "line", "sms",
    ];
    for (const channelType of types) {
      expect(createInboxSchema.safeParse({ name: "Test", channelType }).success).toBe(true);
    }
  });

  it("should reject invalid channel type", () => {
    expect(
      createInboxSchema.safeParse({ name: "Test", channelType: "slack" }).success,
    ).toBe(false);
  });

  it("should reject empty name", () => {
    expect(
      createInboxSchema.safeParse({ name: "", channelType: "email" }).success,
    ).toBe(false);
  });
});

describe("conversationFilterSchema", () => {
  it("should accept empty filter with defaults", () => {
    const result = conversationFilterSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
    }
  });

  it("should accept valid status values (0-3)", () => {
    for (const status of [0, 1, 2, 3]) {
      expect(conversationFilterSchema.safeParse({ status }).success).toBe(true);
    }
  });

  it("should reject out-of-range status", () => {
    expect(conversationFilterSchema.safeParse({ status: 4 }).success).toBe(false);
    expect(conversationFilterSchema.safeParse({ status: -1 }).success).toBe(false);
  });

  it("should reject zero or negative page", () => {
    expect(conversationFilterSchema.safeParse({ page: 0 }).success).toBe(false);
    expect(conversationFilterSchema.safeParse({ page: -1 }).success).toBe(false);
  });

  it("should accept all filter fields together", () => {
    const result = conversationFilterSchema.safeParse({
      status: 0,
      inboxId: 1,
      assigneeId: 2,
      teamId: 3,
      labelId: 4,
      page: 2,
    });
    expect(result.success).toBe(true);
  });
});

describe("contactFilterSchema", () => {
  it("should accept empty filter with defaults", () => {
    const result = contactFilterSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
    }
  });

  it("should accept search string", () => {
    expect(contactFilterSchema.safeParse({ search: "john" }).success).toBe(true);
  });

  it("should accept companyId filter", () => {
    expect(contactFilterSchema.safeParse({ companyId: 5 }).success).toBe(true);
  });

  it("should reject negative companyId", () => {
    expect(contactFilterSchema.safeParse({ companyId: -1 }).success).toBe(false);
  });
});
