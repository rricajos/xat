import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

// Agent presence: userId -> availability (0=online, 1=busy, 2=offline)
let presenceMap: Map<number, number> = new Map();
let presenceListeners: Array<() => void> = [];

function notifyPresenceListeners() {
  for (const fn of presenceListeners) fn();
}

export function onPresenceChange(fn: () => void): () => void {
  presenceListeners.push(fn);
  return () => {
    presenceListeners = presenceListeners.filter((l) => l !== fn);
  };
}

export function connectSocket(accountId: number, userId: number): Socket {
  if (socket?.connected) return socket;

  socket = io({
    path: "/ws",
    query: { accountId: String(accountId), userId: String(userId) },
    transports: ["websocket", "polling"],
  });

  socket.on("connect", () => {
    console.info("[ws] connected");
  });

  socket.on("disconnect", () => {
    console.info("[ws] disconnected");
  });

  socket.on("presence:sync", (agents: { userId: number; availability: number }[]) => {
    for (const agent of agents) {
      presenceMap.set(agent.userId, agent.availability);
    }
    notifyPresenceListeners();
  });

  socket.on("agent:status_changed", (data: { userId: number; availability: number }) => {
    if (data.availability === 2) {
      presenceMap.delete(data.userId);
    } else {
      presenceMap.set(data.userId, data.availability);
    }
    notifyPresenceListeners();
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export function joinConversation(conversationId: number) {
  socket?.emit("join:conversation", conversationId);
}

export function leaveConversation(conversationId: number) {
  socket?.emit("leave:conversation", conversationId);
}

export function emitTypingStart(
  conversationId: number,
  userId: number,
  isPrivate: boolean,
) {
  socket?.emit("typing:start", { conversationId, userId, isPrivate });
}

export function emitTypingStop(conversationId: number, userId: number) {
  socket?.emit("typing:stop", { conversationId, userId });
}

export function updatePresence(availability: number) {
  socket?.emit("presence:update", { availability });
}

export function getAgentAvailability(userId: number): number {
  return presenceMap.get(userId) ?? 2; // Default to offline
}

export function getPresenceMap(): Map<number, number> {
  return presenceMap;
}
