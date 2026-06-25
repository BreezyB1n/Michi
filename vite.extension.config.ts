import { defineConfig } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  publicDir: "extension/public",
  build: {
    target: "es2020",
    outDir: "dist-extension",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        "content-script": path.resolve(__dirname, "src/extension/contentScript.ts"),
        "service-worker": path.resolve(__dirname, "src/extension/serviceWorker.ts")
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]"
      }
    }
  }
});
