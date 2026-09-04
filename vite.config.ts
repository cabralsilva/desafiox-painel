import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

const isCapacitorBuild = process.env.CAPACITOR_BUILD === "true";

export default defineConfig(() => ({
  base: isCapacitorBuild ? "./" : "/",
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? "0.0.0"),
  },
  server: {
    host: "::",
    port: 8081,
    hmr: { overlay: false },
    watch: {
      ignored: ["**/android/**", "**/ios/**"],
    },
    fs: {
      deny: [path.resolve(__dirname, "android"), path.resolve(__dirname, "ios")],
    },
  },
  optimizeDeps: {
    entries: [path.resolve(__dirname, "index.html")],
  },
  plugins: [
    react(),
    VitePWA({
      minify: false,
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "ico.svg", "brand-mark.svg"],
      manifest: {
        name: "DESAFIOX Painel",
        short_name: "Painel DX",
        description: "Painel de gestão administrativa DESAFIOX.",
        lang: "pt-BR",
        dir: "ltr",
        theme_color: "#0a0a0a",
        background_color: "#0a0a0a",
        display: "standalone",
        orientation: "any",
        scope: "/",
        start_url: "/",
        icons: [
          { src: "/brand-mark.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webmanifest}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
