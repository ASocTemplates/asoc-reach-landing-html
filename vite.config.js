import { defineConfig } from "vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderPage } from "./build/layout.js";

const root = path.dirname(fileURLToPath(import.meta.url));
const pagesDir = path.join(root, "pages");

/** Every page fragment under `pages/`, relative to the project root. */
function findPages(dir = pagesDir, prefix = "") {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? findPages(path.join(dir, entry.name), `${prefix}${entry.name}/`)
        : entry.name.endsWith(".html")
          ? [`${prefix}${entry.name}`]
          : [],
    );
}

const pages = findPages();

/**
 * Wraps each `pages/**​/*.html` fragment in its layout (see `build/layout.js`) and
 * serves/emits it at the URL that mirrors its path — `pages/dashboard/analytics.html`
 * becomes `/dashboard/analytics`.
 */
function asocPages() {
  return {
    name: "asoc-pages",

    // `pre` so the wrapped document is what Vite parses for <script>/<link> assets.
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        return renderPage(html);
      },
    },

    // Dev: map a clean URL onto its page fragment, then run the normal HTML pipeline.
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== "GET" && req.method !== "HEAD") return next();
        const url = (req.url ?? "/").split("?")[0];
        if (/^\/(@|src\/|node_modules\/|assets\/)/.test(url)) return next();

        let rel = url === "/" ? "/index" : url.replace(/\/$/, "");
        if (rel.endsWith(".html")) rel = rel.slice(0, -5);
        const file = path.join(pagesDir, `${rel}.html`);
        if (!file.startsWith(pagesDir) || !fs.existsSync(file)) return next();

        const fragment = fs.readFileSync(file, "utf8");
        const html = await server.transformIndexHtml(
          url,
          fragment,
          req.originalUrl,
        );
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end(html);
      });
    },

    // Build: emit `pages/x/y.html` at `dist/x/y.html` (drop the `pages/` prefix).
    // `post` so this runs after Vite's own HTML plugin has added the files.
    generateBundle: {
      order: "post",
      handler(_options, bundle) {
        for (const [key, chunk] of Object.entries(bundle)) {
          if (chunk.fileName.startsWith("pages/")) {
            delete bundle[key];
            chunk.fileName = chunk.fileName.slice("pages/".length);
            bundle[chunk.fileName] = chunk;
          }
        }
      },
    },
  };
}

export default defineConfig({
  appType: "mpa",
  plugins: [asocPages()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: Object.fromEntries(
        pages.map((p) => [p.replace(/\.html$/, ""), path.join(pagesDir, p)]),
      ),
    },
  },
});
