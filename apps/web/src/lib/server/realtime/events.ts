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

  // Calendar/Booking events
  BOOKING_CREATED: "booking:created",
  BOOKING_CANCELLED: "booking:cancelled",
  BOOKING_STATUS_UPDATED: "booking:status_updated",
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

export function broadcastTypingStart(
  accountId: number,
  conversationId: number,
  userId: number,
  userName: string,
  isPrivate: boolean,
) {
  emitToConversation(conversationId, EVENTS.TYPING_START, {
    conversationId,
    userId,
    userName,
    isPrivate,
  });
}

export function broadcastTypingStop(
  accountId: number,
  conversationId: number,
  userId: number,
) {
  emitToConversation(conversationId, EVENTS.TYPING_STOP, {
    conversationId,
    userId,
  });
}

export function broadcastAgentStatusChanged(
  accountId: number,
  userId: number,
  availability: number,
) {
  emitToAccount(accountId, EVENTS.AGENT_STATUS_CHANGED, {
    userId,
    availability,
  });
}

export function broadcastContactUpdated(
  accountId: number,
  contact: unknown,
) {
  emitToAccount(accountId, EVENTS.CONTACT_UPDATED, contact);
}

export function broadcastConversationUpdated(
  accountId: number,
  conversation: unknown,
) {
  emitToAccount(accountId, EVENTS.CONVERSATION_UPDATED, conversation);
}

export function broadcastToAccount(
  accountId: number,
  event: string,
  data: unknown,
) {
  emitToAccount(accountId, event, data);
}
