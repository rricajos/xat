import { error } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";
import { fail } from "@sveltejs/kit";
import {
  getContact,
  updateContact,
} from "$lib/server/services/contact.service";
import { db } from "@xat/db";
import {
  conversations,
  inboxes,
  contactNotes,
  users,
  labels,
  labelTaggings,
} from "@xat/db/schema";
import { eq, and, desc } from "drizzle-orm";

export const load: PageServerLoad = async ({ params, locals }) => {
  const contactId = parseInt(params.id);
  if (isNaN(contactId)) error(404, "Contact not found");

  const contact = await getContact(locals.account!.id, contactId);
  if (!contact) error(404, "Contact not found");

  const [contactConversations, notes, contactLabels, allLabels] =
    await Promise.all([
      // Get contact's conversations
      db
        .select({
          id: conversations.id,
          displayId: conversations.displayId,
          status: conversations.status,
          lastActivityAt: conversations.lastActivityAt,
          createdAt: conversations.createdAt,
          inboxName: inboxes.name,
          inboxChannelType: inboxes.channelType,
        })
        .from(conversations)
        .leftJoin(inboxes, eq(conversations.inboxId, inboxes.id))
        .where(
          and(
            eq(conversations.accountId, locals.account!.id),
            eq(conversations.contactId, contactId),
          ),
        )
        .orderBy(desc(conversations.lastActivityAt))
        .limit(20),

      // Get contact notes
      db
        .select({
          id: contactNotes.id,
          content: contactNotes.content,
          createdAt: contactNotes.createdAt,
          authorName: users.name,
        })
        .from(contactNotes)
        .leftJoin(users, eq(contactNotes.userId, users.id))
        .where(
          and(
            eq(contactNotes.accountId, locals.account!.id),
            eq(contactNotes.contactId, contactId),
          ),
        )
        .orderBy(desc(contactNotes.createdAt)),

      // Get labels attached to this contact
      db
        .select({
          id: labels.id,
          title: labels.title,
          color: labels.color,
        })
        .from(labelTaggings)
        .innerJoin(labels, eq(labelTaggings.labelId, labels.id))
        .where(
          and(
            eq(labelTaggings.accountId, locals.account!.id),
            eq(labelTaggings.taggableType, "Contact"),
            eq(labelTaggings.taggableId, contactId),
          ),
        ),

      // Get all account labels for the add-label dropdown
      db
        .select({ id: labels.id, title: labels.title, color: labels.color })
        .from(labels)
        .where(eq(labels.accountId, locals.account!.id))
        .orderBy(labels.title),
    ]);

  // Filter out already-applied labels
  const appliedIds = new Set(contactLabels.map((l) => l.id));
  const availableLabels = allLabels.filter((l) => !appliedIds.has(l.id));

  return {
    contact,
    conversations: contactConversations,
    notes,
    labels: contactLabels,
    availableLabels,
  };
};

export const actions: Actions = {
  update: async ({ request, locals, params }) => {
    const contactId = parseInt(params.id);
    const formData = await request.formData();

    await updateContact(locals.account!.id, contactId, {
      name: (formData.get("name") as string) || undefined,
      email: (formData.get("email") as string) || undefined,
      phoneNumber: (formData.get("phoneNumber") as string) || undefined,
    });

    return { success: true };
  },

  addNote: async ({ request, locals, params }) => {
    const contactId = parseInt(params.id);
    const formData = await request.formData();
    const content = formData.get("content") as string;

    if (!content?.trim()) return fail(400, { error: "Note content is required" });

    await db.insert(contactNotes).values({
      accountId: locals.account!.id,
      contactId,
      userId: locals.user!.id,
      content: content.trim(),
    });

    return { noteSuccess: true };
  },

  addLabel: async ({ request, locals, params }) => {
    const contactId = parseInt(params.id);
    const formData = await request.formData();
    const labelId = parseInt(formData.get("labelId") as string);
    if (isNaN(labelId)) return fail(400, { error: "Invalid label" });

    await db
      .insert(labelTaggings)
      .values({
        accountId: locals.account!.id,
        labelId,
        taggableType: "Contact",
        taggableId: contactId,
      })
      .onConflictDoNothing();

    return { success: true };
  },

  removeLabel: async ({ request, locals, params }) => {
    const contactId = parseInt(params.id);
    const formData = await request.formData();
    const labelId = parseInt(formData.get("labelId") as string);
    if (isNaN(labelId)) return fail(400, { error: "Invalid label" });

    await db
      .delete(labelTaggings)
      .where(
        and(
          eq(labelTaggings.accountId, locals.account!.id),
          eq(labelTaggings.labelId, labelId),
          eq(labelTaggings.taggableType, "Contact"),
          eq(labelTaggings.taggableId, contactId),
        ),
      );

    return { success: true };
  },
};
