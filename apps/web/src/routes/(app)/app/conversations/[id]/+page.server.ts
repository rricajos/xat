import { error } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";
import {
  getConversation,
  getConversationMessages,
  createMessage,
  updateConversationStatus,
  assignConversation,
  setConversationPriority,
  getContactConversations,
} from "$lib/server/services/conversation.service";
import { getContact } from "$lib/server/services/contact.service";
import { getLabelsForConversation } from "$lib/server/services/label.service";
import { saveFile } from "$lib/server/services/storage.service";
import { db } from "@xat/db";
import { attachments, customAttributeDefinitions } from "@xat/db/schema";
import { eq } from "drizzle-orm";
import { MESSAGE_TYPE } from "@xat/shared";

export const load: PageServerLoad = async ({ params, locals }) => {
  const displayId = parseInt(params.id);
  if (isNaN(displayId)) error(404, "Conversation not found");

  const conversation = await getConversation(locals.account!.id, displayId);
  if (!conversation) error(404, "Conversation not found");

  const [msgs, contact, conversationLabels, previousConversations, attrDefs] = await Promise.all([
    getConversationMessages(locals.account!.id, conversation.id),
    getContact(locals.account!.id, conversation.contactId),
    getLabelsForConversation(locals.account!.id, conversation.id),
    getContactConversations(locals.account!.id, conversation.contactId),
    db.select().from(customAttributeDefinitions).where(eq(customAttributeDefinitions.accountId, locals.account!.id)),
  ]);

  return {
    conversation,
    messages: msgs,
    contact,
    conversationLabels,
    previousConversations,
    conversationAttrDefs: attrDefs.filter((d) => d.attributeModel === "conversation"),
    contactAttrDefs: attrDefs.filter((d) => d.attributeModel === "contact"),
  };
};

export const actions: Actions = {
  send: async ({ request, locals, params }) => {
    const displayId = parseInt(params.id);
    const conversation = await getConversation(locals.account!.id, displayId);
    if (!conversation) error(404, "Conversation not found");

    const formData = await request.formData();
    const content = formData.get("content") as string;
    const isPrivate = formData.get("private") === "true";
    const files = formData.getAll("files") as File[];

    const hasContent = content?.trim();
    const hasFiles = files.length > 0 && files[0].size > 0;

    if (!hasContent && !hasFiles) return { success: false };

    const message = await createMessage({
      accountId: locals.account!.id,
      conversationId: conversation.id,
      content: hasContent ? content.trim() : (hasFiles ? "[Attachment]" : ""),
      messageType: MESSAGE_TYPE.OUTGOING,
      senderType: "User",
      senderId: locals.user!.id,
      private: isPrivate,
      contentType: hasFiles ? "file" : "text",
    });

    // Save attachments
    if (hasFiles) {
      for (const file of files) {
        if (file.size === 0) continue;
        const saved = await saveFile(locals.account!.id, file);
        await db.insert(attachments).values({
          accountId: locals.account!.id,
          messageId: message.id,
          fileType: saved.fileType,
          externalUrl: saved.publicUrl,
          fileName: saved.fileName,
          mimeType: saved.mimeType,
          fileSize: saved.fileSize,
          storagePath: saved.storagePath,
        });
      }
    }

    return { success: true };
  },

  resolve: async ({ locals, params }) => {
    const displayId = parseInt(params.id);
    const conversation = await getConversation(locals.account!.id, displayId);
    if (!conversation) error(404);

    await updateConversationStatus(locals.account!.id, conversation.id, 1);
    return { success: true };
  },

  reopen: async ({ locals, params }) => {
    const displayId = parseInt(params.id);
    const conversation = await getConversation(locals.account!.id, displayId);
    if (!conversation) error(404);

    await updateConversationStatus(locals.account!.id, conversation.id, 0);
    return { success: true };
  },

  pending: async ({ locals, params }) => {
    const displayId = parseInt(params.id);
    const conversation = await getConversation(locals.account!.id, displayId);
    if (!conversation) error(404);

    await updateConversationStatus(locals.account!.id, conversation.id, 2);
    return { success: true };
  },

  snooze: async ({ locals, params }) => {
    const displayId = parseInt(params.id);
    const conversation = await getConversation(locals.account!.id, displayId);
    if (!conversation) error(404);

    await updateConversationStatus(locals.account!.id, conversation.id, 3);
    return { success: true };
  },

  setPriority: async ({ request, locals, params }) => {
    const displayId = parseInt(params.id);
    const conversation = await getConversation(locals.account!.id, displayId);
    if (!conversation) error(404);

    const formData = await request.formData();
    const priority = formData.get("priority") as string;

    await setConversationPriority(
      locals.account!.id,
      conversation.id,
      priority ? parseInt(priority) : null,
    );

    return { success: true };
  },

  assign: async ({ request, locals, params }) => {
    const displayId = parseInt(params.id);
    const conversation = await getConversation(locals.account!.id, displayId);
    if (!conversation) error(404);

    const formData = await request.formData();
    const assigneeId = formData.get("assigneeId") as string;

    await assignConversation(
      locals.account!.id,
      conversation.id,
      assigneeId ? parseInt(assigneeId) : null,
    );

    return { success: true };
  },
};
