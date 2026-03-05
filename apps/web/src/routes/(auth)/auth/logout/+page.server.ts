import { redirect } from "@sveltejs/kit";
import type { Actions } from "./$types";
import {
  getSessionCookie,
  invalidateSession,
  deleteSessionCookie,
} from "$lib/server/auth";

export const actions: Actions = {
  default: async ({ cookies }) => {
    const sessionId = getSessionCookie(cookies);
    if (sessionId) {
      await invalidateSession(sessionId);
    }
    deleteSessionCookie(cookies);
    redirect(302, "/auth/login");
  },
};
