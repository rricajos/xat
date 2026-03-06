import { json, error } from "@sveltejs/kit";
import { requireAuth } from "$lib/server/api-auth.js";
import {
  getBooking,
  updateBookingStatus,
} from "$lib/server/services/calendar.service.js";

export async function GET(event) {
  const { account } = requireAuth(event);
  const id = Number(event.params.id);
  const booking = await getBooking(account.id, id);
  if (!booking) error(404, { message: "Booking not found" });
  return json({ data: booking });
}

export async function PATCH(event) {
  const { account } = requireAuth(event);
  const id = Number(event.params.id);
  const body = await event.request.json().catch(() => ({}));

  const VALID = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"];
  if (!VALID.includes(body.status)) {
    error(400, { message: "Invalid status" });
  }

  const booking = await updateBookingStatus(account.id, id, body.status);
  if (!booking) error(404, { message: "Booking not found" });
  return json({ data: booking });
}
