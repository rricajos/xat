import { getSchedule, listBlockedTimes } from "$lib/server/services/calendar.service.js";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user!;
  const account = locals.account!;

  const [schedule, blockedTimes] = await Promise.all([
    getSchedule(account.id, user.id),
    listBlockedTimes(account.id, user.id),
  ]);

  return { schedule, blockedTimes };
};
