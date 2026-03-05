import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  updateProfileSchema,
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
    const result = updateProfileSchema.safeParse({
      displayName: "Jane",
    });
    expect(result.success).toBe(true);
  });

  it("should accept empty object", () => {
    const result = updateProfileSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should reject invalid availability value", () => {
    const result = updateProfileSchema.safeParse({
      availability: 5,
    });
    expect(result.success).toBe(false);
  });

  it("should accept all valid availability values", () => {
    for (const val of [0, 1, 2]) {
      const result = updateProfileSchema.safeParse({ availability: val });
      expect(result.success).toBe(true);
    }
  });
});
