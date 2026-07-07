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
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "pwa-icon-512.png", "pwa-icon-192.png"],
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallbackDenylist: [/^\/~oauth/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // Take over stale clients immediately and drop old precaches —
        // prevents an old shell requesting assets that no longer exist.
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
      manifest: {
        name: "SEELD – סוכנות פיננסים וביטוח",
        short_name: "SEELD",
        description: "סוכנות פיננסים וביטוח – כלים חכמים לסוכנים ושירות ללקוחות",
        theme_color: "#171717",
        background_color: "#ffffff",
        display: "standalone",
        dir: "rtl",
        lang: "he",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "pwa-icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "pwa-icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
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
