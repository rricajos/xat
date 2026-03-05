import type { RequestHandler } from "./$types";
import { json, error } from "@sveltejs/kit";
import { db } from "@xat/db";
import { contacts, conversations, messages } from "@xat/db/schema";
import { eq, and, or, ilike, desc, sql } from "drizzle-orm";

export const GET: RequestHandler = async ({ url, locals }) => {
  if (!locals.user || !locals.account) error(401, "Unauthorized");

  const q = url.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return json({ data: { contacts: [], conversations: [] } });
  }

  const accountId = locals.account.id;
  const pattern = `%${q}%`;

  const [matchedContacts, matchedConversations] = await Promise.all([
    db
      .select({
        id: contacts.id,
        name: contacts.name,
        email: contacts.email,
        phoneNumber: contacts.phoneNumber,
        avatarUrl: contacts.avatarUrl,
      })
      .from(contacts)
      .where(
        and(
          eq(contacts.accountId, accountId),
          or(
            ilike(contacts.name, pattern),
            ilike(contacts.email, pattern),
            ilike(contacts.phoneNumber, pattern),
          ),
        ),
      )
      .limit(5),

    db
      .select({
        id: conversations.id,
        displayId: conversations.displayId,
        status: conversations.status,
        contactId: conversations.contactId,
        lastActivityAt: conversations.lastActivityAt,
      })
      .from(conversations)
      .where(
        and(
          eq(conversations.accountId, accountId),
          or(
            sql`${conversations.displayId}::text LIKE ${pattern}`,
            sql`EXISTS (
              SELECT 1 FROM ${contacts}
              WHERE ${contacts.id} = ${conversations.contactId}
              AND (${contacts.name} ILIKE ${pattern} OR ${contacts.email} ILIKE ${pattern})
            )`,
          ),
        ),
      )
      .orderBy(desc(conversations.lastActivityAt))
      .limit(5),
  ]);

  return json({
    data: {
      contacts: matchedContacts,
      conversations: matchedConversations,
    },
  });
};
