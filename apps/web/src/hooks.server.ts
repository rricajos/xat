import type { Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import {
  validateSession,
  getSessionCookie,
} from "$lib/server/auth";
import { i18n } from "$lib/i18n";

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

export const handle = sequence(i18n.handle(), authHandle);
