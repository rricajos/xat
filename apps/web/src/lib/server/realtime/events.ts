import { emitToAccount, emitToConversation, emitToAgent } from "./index";

export const EVENTS = {
  // Conversation events
  CONVERSATION_CREATED: "conversation:created",
  CONVERSATION_UPDATED: "conversation:updated",
  CONVERSATION_STATUS_CHANGED: "conversation:status_changed",
  CONVERSATION_ASSIGNED: "conversation:assigned",

  // Message events
  MESSAGE_CREATED: "message:created",
  MESSAGE_UPDATED: "message:updated",

  // Contact events
  CONTACT_CREATED: "contact:created",
  CONTACT_UPDATED: "contact:updated",

  // Typing events
  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",

  // Notification events
  NOTIFICATION_CREATED: "notification:created",

  // Presence events
  AGENT_STATUS_CHANGED: "agent:status_changed",
} as const;

export function broadcastConversationCreated(
  accountId: number,
  conversation: unknown,
) {
  emitToAccount(accountId, EVENTS.CONVERSATION_CREATED, conversation);
}

export function broadcastMessageCreated(
  accountId: number,
  conversationId: number,
  message: unknown,
) {
  emitToAccount(accountId, EVENTS.MESSAGE_CREATED, {
    conversationId,
    message,
  });
  emitToConversation(conversationId, EVENTS.MESSAGE_CREATED, message);
}

export function broadcastConversationStatusChanged(
  accountId: number,
  conversationId: number,
  status: number,
) {
  emitToAccount(accountId, EVENTS.CONVERSATION_STATUS_CHANGED, {
    conversationId,
    status,
  });
}

export function broadcastConversationAssigned(
  accountId: number,
  conversationId: number,
  assigneeId: number | null,
) {
  emitToAccount(accountId, EVENTS.CONVERSATION_ASSIGNED, {
    conversationId,
    assigneeId,
  });

  if (assigneeId) {
    emitToAgent(assigneeId, EVENTS.NOTIFICATION_CREATED, {
      type: "conversation_assignment",
      conversationId,
    });
  }
}

export function broadcastNotification(
  userId: number,
  notification: unknown,
) {
  emitToAgent(userId, EVENTS.NOTIFICATION_CREATED, notification);
}
