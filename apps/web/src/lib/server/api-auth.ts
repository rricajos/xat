import { error } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";

export function requireAuth(event: RequestEvent) {
  if (!event.locals.user || !event.locals.account) {
    error(401, { message: "Unauthorized" });
  }
  return {
    user: event.locals.user,
    account: event.locals.account,
  };
}

export function requireAdmin(event: RequestEvent) {
  const { user, account } = requireAuth(event);
  if (account.role !== "administrator" && account.role !== "owner") {
    error(403, { message: "Forbidden: administrator access required" });
  }
  return { user, account };
}

export function requireSuperAdmin(event: RequestEvent) {
  const { user, account } = requireAuth(event);
  if (user.type !== "super_admin") {
    error(403, { message: "Forbidden: super admin access required" });
  }
  return { user, account };
}

export function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function errorResponse(message: string, status = 400) {
  return new Response(JSON.stringify({ error: { message } }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
