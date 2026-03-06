import type { PageServerLoad, Actions } from "./$types";
import {
  listUserSessions,
  revokeSession,
  revokeAllOtherSessions,
  getSessionCookie,
} from "$lib/server/auth";
import { getUserTwoFactor } from "$lib/server/services/two-factor.service.js";

export const load: PageServerLoad = async ({ locals, cookies }) => {
  const [sessions, twoFactor] = await Promise.all([
    listUserSessions(locals.user!.id),
    getUserTwoFactor(locals.user!.id),
  ]);
  const currentSessionId = getSessionCookie(cookies);

  return {
    sessions: sessions.map((s) => ({
      ...s,
      id: s.id.slice(0, 8) + "..." + s.id.slice(-8),
      fullId: s.id,
      isCurrent: s.id === currentSessionId,
    })),
    twoFaEnabled: twoFactor?.twoFactorEnabled ?? false,
  };
};

export const actions: Actions = {
  revoke: async ({ request, locals }) => {
    const formData = await request.formData();
    const sessionId = formData.get("sessionId") as string;
    await revokeSession(locals.user!.id, sessionId);
    return { success: true };
  },

  revokeAll: async ({ locals, cookies }) => {
    const currentSessionId = getSessionCookie(cookies);
    if (currentSessionId) {
      await revokeAllOtherSessions(locals.user!.id, currentSessionId);
    }
    return { success: true };
  },
};
