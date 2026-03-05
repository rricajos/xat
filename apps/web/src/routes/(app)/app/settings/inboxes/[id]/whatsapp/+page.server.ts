import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { getInbox } from "$lib/server/services/inbox.service";

export const load: PageServerLoad = async ({ params, locals }) => {
  const inboxId = parseInt(params.id);
  if (isNaN(inboxId)) error(404, "Inbox not found");

  const inbox = await getInbox(locals.account!.id, inboxId);
  if (!inbox) error(404, "Inbox not found");
  if (inbox.channelType !== "whatsapp") error(400, "Not a WhatsApp inbox");

  return { inbox };
};
