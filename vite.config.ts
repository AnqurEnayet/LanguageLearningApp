/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages serves the site from a repo subpath, so the production build is
// based at /<repo>/ while dev stays at the root. Everything that needs to know
// the base — asset URLs, the router basename, the PWA scope — derives from here.
const REPO = "LanguageLearningApp";

export default defineConfig(({ command }) => {
  const base = command === "build" ? `/${REPO}/` : "/";

  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["icon.svg"],
        manifest: {
          name: "German Frequency Reader",
          short_name: "DE Reader",
          description: "Learn German through frequency-ordered stories",
          theme_color: "#0f766e",
          background_color: "#080d0c",
          display: "standalone",
          id: base,
          scope: base,
          start_url: base,
          icons: [
            {
              src: "icon.svg",
              sizes: "any",
              type: "image/svg+xml",
              purpose: "any maskable"
            }
          ]
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,svg,json,woff2}"],
          // Deep links are served by the SPA shell, not by separate documents.
          navigateFallback: `${base}index.html`
        }
      })
    ],
    test: {
      environment: "node",
      include: ["src/**/*.test.ts"]
    }
  };
});
