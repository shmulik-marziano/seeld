import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    // PWA removed (2026-07-20). selfDestroying ships a suicide sw.js that
    // unregisters the previously-installed service worker and clears its
    // caches on existing visitors' browsers. Keep this until the old SW has
    // drained from the user base; removing the plugin outright would leave
    // stale service workers controlling the page forever.
    VitePWA({ selfDestroying: true, manifest: false }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return undefined;
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/react-router-dom/") ||
            id.includes("node_modules/react-router/") ||
            id.includes("node_modules/scheduler/")
          ) {
            return "react-vendor";
          }
          if (id.includes("node_modules/framer-motion/")) return "motion";
          // NOTE: do NOT force recharts into a manual "charts" chunk.
          // It creates a react-vendor <-> charts circular chunk import and the app
          // crashes at startup with "Cannot access '_' before initialization".
          // recharts is only imported by lazy routes, so Rollup already keeps it
          // out of the entry chunk on its own.
          if (id.includes("node_modules/@supabase/")) return "supabase";
          return undefined;
        },
      },
    },
  },
}));
