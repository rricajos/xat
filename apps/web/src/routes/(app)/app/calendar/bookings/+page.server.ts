import { listBookings } from "$lib/server/services/calendar.service.js";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, url }) => {
  const user = locals.user!;
  const account = locals.account!;
  const status = url.searchParams.get("status") ?? undefined;
  const all = url.searchParams.get("all") === "1";

  const bookings = await listBookings(account.id, {
    userId: all ? undefined : user.id,
    status,
  });

  return { bookings, status: status ?? "ALL", all };
};
