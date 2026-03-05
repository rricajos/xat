import { createServer } from "node:http";
import { handler } from "./build/handler.js";
import { Server as SocketIOServer } from "socket.io";

const PORT = parseInt(process.env.PORT || "3000", 10);
const HOST = process.env.HOST || "0.0.0.0";

const httpServer = createServer(handler);

// Attach Socket.IO
const io = new SocketIOServer(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  path: "/ws",
});

io.on("connection", (socket) => {
  const accountId = socket.handshake.query.accountId;
  const userId = socket.handshake.query.userId;

  if (accountId) socket.join(`account:${accountId}`);
  if (userId) socket.join(`agent:${userId}`);

  socket.on("join:conversation", (conversationId) => {
    socket.join(`conversation:${conversationId}`);
  });

  socket.on("leave:conversation", (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
  });

  socket.on("typing:start", (data) => {
    socket.to(`conversation:${data.conversationId}`).emit("typing:start", data);
  });

  socket.on("typing:stop", (data) => {
    socket.to(`conversation:${data.conversationId}`).emit("typing:stop", data);
  });

  socket.on("presence:update", (data) => {
    if (accountId) {
      socket.to(`account:${accountId}`).emit("agent:status_changed", data);
    }
  });
});

// Make io globally available for services
globalThis.__socketIO = io;

httpServer.listen(PORT, HOST, () => {
  console.log(`[xat] Server running on http://${HOST}:${PORT}`);
  console.log(`[xat] Socket.IO listening on /ws`);
});
