import { db } from "@xat/db";
import { contacts, conversations, messages, contactNotes } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Merge two contacts into one. The primary contact is kept and the
 * secondary contact's conversations, messages, and notes are reassigned.
 * The secondary contact is then deleted.
 */
export async function mergeContacts(
  accountId: number,
  primaryContactId: number,
  secondaryContactId: number,
): Promise<{ mergedConversations: number; mergedNotes: number }> {
  // Verify both contacts belong to the account
  const [primary] = await db
    .select()
    .from(contacts)
    .where(
      and(eq(contacts.id, primaryContactId), eq(contacts.accountId, accountId)),
    )
    .limit(1);

  const [secondary] = await db
    .select()
    .from(contacts)
    .where(
      and(
        eq(contacts.id, secondaryContactId),
        eq(contacts.accountId, accountId),
      ),
    )
    .limit(1);

  if (!primary) throw new Error("Primary contact not found");
  if (!secondary) throw new Error("Secondary contact not found");

  // Merge missing fields from secondary to primary
  const updates: Record<string, unknown> = {};
  if (!primary.email && secondary.email) updates.email = secondary.email;
  if (!primary.phoneNumber && secondary.phoneNumber)
    updates.phoneNumber = secondary.phoneNumber;
  if (!primary.avatarUrl && secondary.avatarUrl)
    updates.avatarUrl = secondary.avatarUrl;
  if (!primary.companyId && secondary.companyId)
    updates.companyId = secondary.companyId;
  if (!primary.identifier && secondary.identifier)
    updates.identifier = secondary.identifier;

  if (Object.keys(updates).length > 0) {
    await db
      .update(contacts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contacts.id, primaryContactId));
  }

  // Reassign conversations from secondary to primary
  const convResult = await db
    .update(conversations)
    .set({ contactId: primaryContactId, updatedAt: new Date() })
    .where(
      and(
        eq(conversations.contactId, secondaryContactId),
        eq(conversations.accountId, accountId),
      ),
    )
    .returning();

  // Reassign messages sender
  await db
    .update(messages)
    .set({ senderId: primaryContactId })
    .where(
      and(
        eq(messages.senderId, secondaryContactId),
        eq(messages.senderType, "Contact"),
        eq(messages.accountId, accountId),
      ),
    );

  // Reassign contact notes
  const noteResult = await db
    .update(contactNotes)
    .set({ contactId: primaryContactId, updatedAt: new Date() })
    .where(
      and(
        eq(contactNotes.contactId, secondaryContactId),
        eq(contactNotes.accountId, accountId),
      ),
    )
    .returning();

  // Delete the secondary contact
  await db
    .delete(contacts)
    .where(eq(contacts.id, secondaryContactId));

  return {
    mergedConversations: convResult.length,
    mergedNotes: noteResult.length,
  };
}
