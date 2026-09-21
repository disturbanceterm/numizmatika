/**
 * Kopira MapLibre web-worker fajlove iz node_modules u public/maplibre/.
 *
 * REASON: MapLibre 6 nalazi svoj worker preko `import.meta.url` (./maplibre-gl-worker.mjs pored
 * glavnog modula). Pod Next.js/Turbopack-om taj URL pokazuje u /_next/static/chunks/ gdje fajl ne
 * postoji (server vrati HTML 404 -> "non-JavaScript MIME type"), pa mapa ostane prazna. Zato
 * worker serviramo iz public/ i mapi kažemo `setWorkerUrl("/maplibre/maplibre-gl-worker.mjs")`.
 * Skripta se pokreće na postinstall/predev/prebuild da verzija uvijek prati node_modules.
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 */
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules", "maplibre-gl", "dist");
const dest = join(root, "public", "maplibre");

const FILES = ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"];

if (!existsSync(src)) {
  console.warn("[maplibre] node_modules/maplibre-gl/dist ne postoji – preskačem kopiranje workera.");
  process.exit(0);
}

mkdirSync(dest, { recursive: true });
for (const f of FILES) {
  copyFileSync(join(src, f), join(dest, f));
}
console.log(`[maplibre] worker kopiran u public/maplibre/ (${FILES.join(", ")})`);
