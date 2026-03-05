import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "node:http";

let io: SocketIOServer | null = null;

// Track online agents: Map<accountId, Map<userId, availability>>
const agentPresence = new Map<string, Map<string, number>>();

export function initSocketIO(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    path: "/ws",
  });

  io.on("connection", (socket) => {
    const accountId = socket.handshake.query.accountId as string;
    const userId = socket.handshake.query.userId as string;

    if (accountId) {
      socket.join(`account:${accountId}`);
    }

    if (userId) {
      socket.join(`agent:${userId}`);
    }

    // Track presence
    if (accountId && userId) {
      if (!agentPresence.has(accountId)) {
        agentPresence.set(accountId, new Map());
      }
      agentPresence.get(accountId)!.set(userId, 0); // 0 = online
      socket.to(`account:${accountId}`).emit("agent:status_changed", {
        userId: parseInt(userId),
        availability: 0,
      });
    }

    // Send current presence state to newly connected client
    if (accountId && agentPresence.has(accountId)) {
      const presenceMap = agentPresence.get(accountId)!;
      const presenceList = Array.from(presenceMap.entries()).map(([uid, avail]) => ({
        userId: parseInt(uid),
        availability: avail,
      }));
      socket.emit("presence:sync", presenceList);
    }

    socket.on("join:conversation", (conversationId: number) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on("leave:conversation", (conversationId: number) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on("typing:start", (data: { conversationId: number; userId: number; isPrivate: boolean }) => {
      socket.to(`conversation:${data.conversationId}`).emit("typing:start", {
        conversationId: data.conversationId,
        userId: data.userId,
        isPrivate: data.isPrivate,
      });
    });

    socket.on("typing:stop", (data: { conversationId: number; userId: number }) => {
      socket.to(`conversation:${data.conversationId}`).emit("typing:stop", {
        conversationId: data.conversationId,
        userId: data.userId,
      });
    });

    socket.on("presence:update", (data: { availability: number }) => {
      if (accountId && userId) {
        agentPresence.get(accountId)?.set(userId, data.availability);
        socket.to(`account:${accountId}`).emit("agent:status_changed", {
          userId: parseInt(userId),
          availability: data.availability,
        });
      }
    });

    socket.on("disconnect", () => {
      if (accountId && userId) {
        // Check if user has other active connections
        const room = io?.sockets.adapter.rooms.get(`agent:${userId}`);
        if (!room || room.size === 0) {
          agentPresence.get(accountId)?.delete(userId);
          socket.to(`account:${accountId}`).emit("agent:status_changed", {
            userId: parseInt(userId),
            availability: 2, // offline
          });
        }
      }
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function getAgentPresence(accountId: number): Map<string, number> {
  return agentPresence.get(String(accountId)) ?? new Map();
}

// Event emitters for services to use
export function emitToAccount(accountId: number, event: string, data: unknown) {
  io?.to(`account:${accountId}`).emit(event, data);
}

export function emitToConversation(
  conversationId: number,
  event: string,
  data: unknown,
) {
  io?.to(`conversation:${conversationId}`).emit(event, data);
}

export function emitToAgent(userId: number, event: string, data: unknown) {
  io?.to(`agent:${userId}`).emit(event, data);
}
