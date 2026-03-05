import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { paraglide } from "@inlang/paraglide-sveltekit/vite";
import { defineConfig } from "vitest/config";
import { socketIOPlugin } from "./src/lib/server/vite-socket-plugin";

export default defineConfig({
  plugins: [
    tailwindcss(),
    paraglide({
      project: "./project.inlang",
      outdir: "./src/lib/paraglide",
    }),
    sveltekit(),
    socketIOPlugin(),
  ],
  test: {
    include: ["src/**/*.test.ts"],
  },
});
