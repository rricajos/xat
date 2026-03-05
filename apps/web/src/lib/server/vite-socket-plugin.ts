import type { ViteDevServer, Plugin } from "vite";

export function socketIOPlugin(): Plugin {
  return {
    name: "xat-socket-io",
    configureServer(server: ViteDevServer) {
      if (!server.httpServer) return;

      import("./realtime/index.js").then(({ initSocketIO }) => {
        initSocketIO(server.httpServer! as import("node:http").Server);
        console.log("[xat] Socket.IO attached to Vite dev server on /ws");
      });
    },
  };
}
