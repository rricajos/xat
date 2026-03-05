import type { RequestHandler } from "./$types";
import { requireAuth, jsonResponse } from "$lib/server/api-auth";
import {
  listContacts,
  createContact,
} from "$lib/server/services/contact.service";

export const GET: RequestHandler = async (event) => {
  const { account } = requireAuth(event);
  const url = event.url;

  const page = parseInt(url.searchParams.get("page") ?? "1");
  const search = url.searchParams.get("search") ?? undefined;

  const result = await listContacts(account.id, { page, search });

  return jsonResponse({
    contacts: result.data,
    meta: { total: result.total, page },
  });
};

export const POST: RequestHandler = async (event) => {
  const { account } = requireAuth(event);
  const body = await event.request.json();

  const contact = await createContact({
    accountId: account.id,
    name: body.name,
    email: body.email,
    phoneNumber: body.phone_number,
    identifier: body.identifier,
  });

  return jsonResponse(contact, 201);
};
