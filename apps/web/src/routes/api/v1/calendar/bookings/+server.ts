import { json } from "@sveltejs/kit";
import { requireAuth } from "$lib/server/api-auth.js";
import { listBookings } from "$lib/server/services/calendar.service.js";

export async function GET(event) {
  const { user, account } = requireAuth(event);
  const url = new URL(event.request.url);
  const status = url.searchParams.get("status") ?? undefined;
  const from = url.searchParams.get("from") ? new Date(url.searchParams.get("from")!) : undefined;
  const to = url.searchParams.get("to") ? new Date(url.searchParams.get("to")!) : undefined;
  const all = url.searchParams.get("all") === "1";

  const bookings = await listBookings(account.id, {
    userId: all ? undefined : user.id,
    status,
    from,
    to,
  });
  return json({ data: bookings });
}
