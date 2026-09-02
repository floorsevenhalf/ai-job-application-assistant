import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  publicDir: resolve(projectRoot, "extension/public"),
  build: {
    // Chrome extension pages load shared chunks through their module graph.
    // Preload hints can be rejected as cross-world extension resources.
    modulePreload: false,
    outDir: resolve(projectRoot, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(projectRoot, "extension/popup/index.html"),
        options: resolve(projectRoot, "extension/options/index.html")
      },
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]"
      }
    }
  }
});
