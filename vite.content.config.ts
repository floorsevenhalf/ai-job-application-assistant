import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  publicDir: false,
  build: {
    outDir: resolve(projectRoot, "dist"),
    emptyOutDir: false,
    lib: {
      entry: resolve(projectRoot, "extension/content/index.ts"),
      name: "AIJobApplicationAssistantContent",
      formats: ["iife"],
      fileName: () => "content.js"
    }
  }
});