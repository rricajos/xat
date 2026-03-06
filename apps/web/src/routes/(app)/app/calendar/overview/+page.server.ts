import { listBookings, listBlockedTimes } from "$lib/server/services/calendar.service.js";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, url }) => {
  const user = locals.user!;
  const account = locals.account!;

  const weekParam = url.searchParams.get("week");
  const weekStart = weekParam ? new Date(weekParam) : new Date();
  if (isNaN(weekStart.getTime())) weekStart.setTime(Date.now());

  // Normalize to Sunday
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const [bookings, allBlocked] = await Promise.all([
    listBookings(account.id, { userId: user.id, from: weekStart, to: weekEnd }),
    listBlockedTimes(account.id, user.id),
  ]);

  const blockedTimes = allBlocked.filter((b) => {
    const s = new Date(b.startAt);
    return s >= weekStart && s < weekEnd;
  });

  return {
    bookings,
    blockedTimes,
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
  };
};
