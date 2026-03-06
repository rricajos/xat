import { describe, it, expect } from "vitest";
import { checkRateLimit } from "$lib/server/rate-limit";

describe("checkRateLimit", () => {
  it("should allow requests within limit", () => {
    const key = `test-allow-${Date.now()}`;
    const result = checkRateLimit(key, { windowMs: 60000, maxRequests: 5 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("should track request count", () => {
    const key = `test-count-${Date.now()}`;
    const config = { windowMs: 60000, maxRequests: 3 };

    checkRateLimit(key, config);
    checkRateLimit(key, config);
    const third = checkRateLimit(key, config);

    expect(third.allowed).toBe(true);
    expect(third.remaining).toBe(0);
  });

  it("should deny requests over limit", () => {
    const key = `test-deny-${Date.now()}`;
    const config = { windowMs: 60000, maxRequests: 2 };

    checkRateLimit(key, config);
    checkRateLimit(key, config);
    const over = checkRateLimit(key, config);

    expect(over.allowed).toBe(false);
    expect(over.remaining).toBe(0);
  });

  it("should reset after window expires", async () => {
    const key = `test-reset-${Date.now()}`;
    const config = { windowMs: 10, maxRequests: 1 };

    checkRateLimit(key, config);

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 20));

    const result = checkRateLimit(key, config);
    expect(result.allowed).toBe(true);
  });

  it("should track different keys independently", () => {
    const key1 = `test-key1-${Date.now()}`;
    const key2 = `test-key2-${Date.now()}`;
    const config = { windowMs: 60000, maxRequests: 1 };

    checkRateLimit(key1, config);
    checkRateLimit(key1, config); // Over limit for key1

    const result = checkRateLimit(key2, config);
    expect(result.allowed).toBe(true);
  });
});
