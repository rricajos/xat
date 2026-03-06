import { json, error } from "@sveltejs/kit";
import { cancelBookingByToken } from "$lib/server/services/calendar.service.js";

export async function POST(event) {
  const { cancelToken } = event.params;
  const booking = await cancelBookingByToken(cancelToken);
  if (!booking) error(404, { message: "Booking not found or already cancelled" });
  return json({ data: { status: "CANCELLED" } });
}
