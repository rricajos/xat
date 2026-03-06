import type { Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import {
  validateSession,
  getSessionCookie,
} from "$lib/server/auth";
import { validateApiToken } from "$lib/server/services/api-token.service";
import { rateLimitApi, rateLimitAuth } from "$lib/server/rate-limit";
import { i18n } from "$lib/i18n";

const rateLimitHandle: Handle = async ({ event, resolve }) => {
  const path = event.url.pathname;

  // Rate limit auth endpoints more strictly
  if (path.startsWith("/auth/")) {
    const { allowed, headers } = rateLimitAuth(event.request);
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...headers } },
      );
    }
  }

  // Rate limit API endpoints
  if (path.startsWith("/api/")) {
    const { allowed, headers } = rateLimitApi(event.request);
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded" }),
        { status: 429, headers: { "Content-Type": "application/json", ...headers } },
      );
    }
  }

  return resolve(event);
};

const authHandle: Handle = async ({ event, resolve }) => {
  const sessionId = getSessionCookie(event.cookies);

  if (sessionId) {
    const result = await validateSession(sessionId);
    if (result) {
      event.locals.user = result.user;
      event.locals.account = result.account;
    } else {
      event.locals.user = null;
      event.locals.account = null;
    }
  } else {
    event.locals.user = null;
    event.locals.account = null;
  }

  // API token auth for /api/ routes when no session
  if (!event.locals.user && event.url.pathname.startsWith("/api/")) {
    const authHeader = event.request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const result = await validateApiToken(token);
      if (result) {
        event.locals.user = result.user;
        event.locals.account = result.account;
      }
    }
  }

  // Protect (app) routes
  if (event.url.pathname.startsWith("/app") && !event.locals.user) {
    return new Response(null, {
      status: 302,
      headers: { location: "/auth/login" },
    });
  }

  // Protect super-admin routes
  if (event.url.pathname.startsWith("/super-admin")) {
    if (!event.locals.user) {
      return new Response(null, {
        status: 302,
        headers: { location: "/auth/login" },
      });
    }
    if (event.locals.user.type !== "super_admin") {
      return new Response("Forbidden", { status: 403 });
    }
  }

  return resolve(event);
};

export const handle = sequence(i18n.handle(), rateLimitHandle, authHandle);
