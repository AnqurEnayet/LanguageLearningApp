// GitHub Pages has no SPA rewrite: an unknown path returns 404.html. Serving the
// app shell from there lets deep links like /chapter/de-ch003 load cold. Once the
// service worker is installed, workbox's navigateFallback takes over.
import { copyFileSync } from "node:fs";

copyFileSync("dist/index.html", "dist/404.html");
console.log("postbuild: dist/404.html written (SPA fallback)");
