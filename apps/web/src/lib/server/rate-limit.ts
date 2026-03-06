const store = new Map<string, { count: number; resetAt: number }>();

const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const DEFAULT_API_LIMIT: RateLimitConfig = {
  windowMs: 60_000,
  maxRequests: 100,
};

const AUTH_LIMIT: RateLimitConfig = {
  windowMs: 300_000,
  maxRequests: 10,
};

export function checkRateLimit(
  key: string,
  config: RateLimitConfig = DEFAULT_API_LIMIT,
): { allowed: boolean; remaining: number; resetAt: number } {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }

  entry.count++;

  if (entry.count > config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function rateLimitApi(request: Request): {
  allowed: boolean;
  headers: Record<string, string>;
} {
  const ip = getClientIp(request);
  const result = checkRateLimit(`api:${ip}`, DEFAULT_API_LIMIT);

  return {
    allowed: result.allowed,
    headers: {
      "X-RateLimit-Limit": String(DEFAULT_API_LIMIT.maxRequests),
      "X-RateLimit-Remaining": String(result.remaining),
      "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    },
  };
}

export function rateLimitAuth(request: Request): {
  allowed: boolean;
  headers: Record<string, string>;
} {
  const ip = getClientIp(request);
  const result = checkRateLimit(`auth:${ip}`, AUTH_LIMIT);

  return {
    allowed: result.allowed,
    headers: {
      "X-RateLimit-Limit": String(AUTH_LIMIT.maxRequests),
      "X-RateLimit-Remaining": String(result.remaining),
      "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    },
  };
}
