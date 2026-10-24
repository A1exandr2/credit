import { build } from "esbuild";
import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("..", import.meta.url));
const result = await build({
  entryPoints: [root + "/scripts/offline-entry.jsx"],
  bundle: true,
  write: false,
  outfile: root + "/preview-bundle.js",
  format: "iife",
  platform: "browser",
  jsx: "automatic",
  minify: true,
  define: { "process.env.NODE_ENV": '"production"' },
  loader: { ".woff2": "dataurl" },
});
const js = result.outputFiles.find((f) => f.path.endsWith(".js")).text;
const css = result.outputFiles.find((f) => f.path.endsWith(".css")).text;
const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Альфа · Локальная демонстрация</title><style>${css}</style></head><body><div id="root"></div><script>window.__ALFA_OFFLINE__=true;</script><script>${js.replace(/<\/script/gi, "<\\/script")}</script></body></html>`;
const dest = fileURLToPath(new URL("../../preview", import.meta.url));
await mkdir(dest, { recursive: true });
await writeFile(dest + "/OPEN.html", html);
await writeFile(
  fileURLToPath(new URL("../../ОТКРЫТЬ.html", import.meta.url)),
  html,
);
console.log("Standalone HTML created. It works without Node.js or a backend.");
