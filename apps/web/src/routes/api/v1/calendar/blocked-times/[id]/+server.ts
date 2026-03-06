import { requireAuth } from "$lib/server/api-auth.js";
import { deleteBlockedTime } from "$lib/server/services/calendar.service.js";

export async function DELETE(event) {
  const { user, account } = requireAuth(event);
  const id = Number(event.params.id);
  await deleteBlockedTime(account.id, user.id, id);
  return new Response(null, { status: 204 });
}
