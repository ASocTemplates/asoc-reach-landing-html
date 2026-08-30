/**
 * Build-time layout renderer.
 *
 * Every page under `pages/` is written as a *fragment*: a `<!--@meta … -->` block
 * followed by the page body. At build time this module wraps that fragment in one of
 * three shells — `app` (sidebar + topbar + footer), `auth`, or `blank` — and renders
 * the sidebar from `src/nav.config.js`.
 *
 * Nothing here runs in the browser: the shipped `dist/*.html` files are complete
 * documents you can open straight off disk. Edit a partial once, rebuild, and every
 * page picks it up.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { navGroups, navHrefs, marketingNav } from "../src/nav.config.js";
import { site } from "../src/site.config.js";

const require = createRequire(import.meta.url);
const ICON_DIR = path.join(
  path.dirname(require.resolve("lucide-static/package.json")),
  "icons",
);

/* ------------------------------------------------------------------ helpers */

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const icon = (name, cls = "size-5 shrink-0") =>
  name ? `<i data-lucide="${name}" class="${cls}"></i>` : "";

/**
 * Replace every `<i data-lucide="name" class="…"></i>` with the real Lucide SVG.
 *
 * Done at build time on purpose: the icons ship as markup, so there is no icon
 * library in the bundle, no flash of un-iconed buttons, and no JS requirement for
 * something as basic as a chevron. An unknown icon name fails the build rather than
 * silently rendering nothing.
 */
const ICON_RE = /<i\s+data-lucide="([a-z0-9-]+)"([^>]*)><\/i>/g;

/**
 * Lucide renamed a batch of icons; the old spellings are still what most snippets
 * and docs use, so accept both rather than making that a build error.
 */
const ICON_ALIASES = {
  "bar-chart-3": "chart-column",
  "bar-chart": "chart-no-axes-column",
  "check-circle-2": "circle-check-big",
  "more-vertical": "ellipsis-vertical",
  "more-horizontal": "ellipsis",
  "user-circle": "circle-user",
  "user-square-2": "square-user",
  "kanban-square": "square-kanban",
  "upload-cloud": "cloud-upload",
  "download-cloud": "cloud-download",
};

function inlineIcons(html) {
  return html.replace(ICON_RE, (_match, rawName, attrs) => {
    const name = ICON_ALIASES[rawName] ?? rawName;
    const file = path.join(ICON_DIR, `${name}.svg`);
    if (!fs.existsSync(file)) {
      throw new Error(
        `Unknown Lucide icon "${name}" — check the name at https://lucide.dev/icons`,
      );
    }
    const cls = (attrs.match(/class="([^"]*)"/) ?? [, ""])[1];
    const classes = `lucide lucide-${name} ${cls}`.trim();

    // Every other attribute on the `<i>` moves onto the `<svg>`. Dropping them was
    // a quiet bug: `data-collapse-chevron` never reached the DOM, so accordion
    // chevrons could not rotate — the sidebar's only worked because collapse.js
    // also matches the generated `.lucide-chevron-right` class.
    const passthrough = (attrs.match(/[a-zA-Z][a-zA-Z0-9-]*(="[^"]*")?/g) ?? [])
      .filter((attr) => !/^(class|data-lucide)\b/.test(attr));

    // Supply the defaults only where the author has not set them.
    const has = (attr) => passthrough.some((a) => a.startsWith(attr));
    const defaults = [
      has("aria-hidden") || has("aria-label") ? "" : 'aria-hidden="true"',
      has("focusable") ? "" : 'focusable="false"',
    ].filter(Boolean);

    const attributes = [...defaults, `class="${classes}"`, ...passthrough].join(" ");

    return fs
      .readFileSync(file, "utf8")
      .replace(/<!--[\s\S]*?-->/g, "") // strip lucide-static's license comment
      .replace(/\s*class="[^"]*"/, "")
      .replace(/\s*\n\s*/g, " ")
      .trim()
      .replace(/^<svg/, `<svg ${attributes}`);
  });
}

/** The command palette's search index — every leaf page in the sidebar. */
function pageIndex() {
  return navGroups.flatMap((group) =>
    group.items.flatMap((item) => [
      ...(item.href ? [{ title: item.title, href: item.href, group: group.label }] : []),
      ...(item.children ?? []).map((child) => ({
        title: `${item.title} · ${child.title}`,
        href: child.href,
        group: group.label,
      })),
    ]),
  );
}

/**
 * The single nav href that best matches this page: the longest boundary-prefix
 * match, so `/commerce/orders/42` lights up "Orders" and `/store-client/cart`
 * lights up "Cart" rather than "Home".
 */
function resolveActive(pageHref) {
  if (!pageHref) return null;
  let best = null;
  for (const href of navHrefs) {
    const matches = pageHref === href || pageHref.startsWith(href + "/");
    if (matches && (best === null || href.length > best.length)) best = href;
  }
  return best;
}

const isParentActive = (item, active) =>
  item.href === active || (item.children ?? []).some((c) => c.href === active);

/* ------------------------------------------------------------------ sidebar */

function renderBadge(text, extra = "") {
  return `<span class="ml-auto inline-flex h-4 items-center rounded-full bg-primary/10 px-1.5 text-[0.625rem] font-semibold uppercase text-primary ${extra}">${esc(text)}</span>`;
}

function renderLeaf(item, active) {
  const isActive = item.href === active;
  return `
          <a
            href="${esc(item.href)}"
            ${isActive ? 'aria-current="page"' : ""}
            class="group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-primary/15 text-foreground"
                : "text-sidebar-foreground hover:bg-secondary hover:text-foreground"
            }"
          >
            ${isActive ? '<span class="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary"></span>' : ""}
            ${icon(item.icon)}
            <span class="truncate sidebar-label">${esc(item.title)}</span>
            ${item.badge ? renderBadge(item.badge, "sidebar-label") : ""}
          </a>`;
}

function renderParent(item, active) {
  const open = isParentActive(item, active);
  const children = (item.children ?? [])
    .map((child) => {
      const childActive = child.href === active;
      return `
              <li>
                <a
                  href="${esc(child.href)}"
                  ${childActive ? 'aria-current="page"' : ""}
                  class="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
                    childActive
                      ? "bg-primary/15 font-medium text-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }"
                >
                  <span class="truncate">${esc(child.title)}</span>
                  ${child.badge ? renderBadge(child.badge) : ""}
                </a>
              </li>`;
    })
    .join("");

  return `
          <button
            type="button"
            data-collapse-trigger
            aria-expanded="${open}"
            class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              open
                ? "text-foreground"
                : "text-sidebar-foreground hover:bg-secondary hover:text-foreground"
            }"
          >
            ${icon(item.icon)}
            <span class="truncate sidebar-label">${esc(item.title)}</span>
            ${item.badge ? renderBadge(item.badge, "sidebar-label") : ""}
            <i
              data-lucide="chevron-right"
              class="sidebar-label size-4 shrink-0 transition-transform ${item.badge ? "ml-1.5" : "ml-auto"} ${open ? "rotate-90" : ""}"
            ></i>
          </button>
          <ul
            data-collapse-panel
            class="ml-4 mt-1 space-y-0.5 border-l border-border pl-4 ${open ? "" : "hidden"}"
          >${children}
          </ul>`;
}

function renderNav(active) {
  const groups = navGroups
    .map(
      (group) => `
        <div class="space-y-1">
          <p class="sidebar-label px-3 pb-1 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
            ${esc(group.label)}
          </p>
          <ul class="space-y-0.5">
            ${group.items
              .map(
                (item) =>
                  `<li>${item.children ? renderParent(item, active) : renderLeaf(item, active)}</li>`,
              )
              .join("\n            ")}
          </ul>
        </div>`,
    )
    .join("\n");

  return `
      <nav aria-label="Main navigation" class="flex flex-col gap-5 px-3 py-4">${groups}
      </nav>`;
}

function renderSidebar(active) {
  return `
    <!-- Sidebar ================================================================ -->
    <aside
      id="sidebar"
      aria-label="Sidebar"
      class="fixed inset-y-0 left-0 z-40 flex w-64 -translate-x-full flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200 lg:translate-x-0"
    >
      <div class="flex h-16 shrink-0 items-center border-b border-sidebar-border px-4">
        <a href="${esc(site.homeHref)}" class="flex items-center gap-2">
          <img src="${site.logo}" alt="${esc(site.name)}" class="sidebar-label h-10 w-auto shrink-0 object-contain" />
          <img src="${site.mark}" alt="${esc(site.name)}" class="sidebar-mark hidden h-9 w-9 shrink-0 object-contain" />
        </a>
      </div>

      <div class="scrollbar-thin flex-1 overflow-y-auto">${renderNav(active)}
      </div>

      <div class="hidden border-t border-sidebar-border p-2 lg:block">
        <button
          type="button"
          id="sidebar-collapse"
          aria-label="Collapse sidebar"
          class="inline-flex w-full items-center justify-start gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <i data-lucide="panel-left-close" class="size-5 shrink-0"></i>
          <span class="sidebar-label">Collapse</span>
        </button>
      </div>
    </aside>

    <div
      id="sidebar-backdrop"
      hidden
      class="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-[1px] lg:hidden"
    ></div>`;
}

/* ------------------------------------------------------------------- topbar */

const NOTIFICATIONS = [
  { title: "New order #1042", desc: "Congratulate the seller", time: "2m" },
  { title: "Server payment received", desc: "$1,250 from Acme Co.", time: "1h" },
  { title: "New member joined", desc: "Priya Sharma — Designer", time: "3h" },
];

function renderTopbar() {
  const items = NOTIFICATIONS.map(
    (n) => `
            <li>
              <a href="#" class="flex flex-col gap-0.5 rounded-md px-2 py-2 transition-colors hover:bg-secondary">
                <span class="text-sm font-medium text-foreground">${esc(n.title)}</span>
                <span class="text-xs text-muted-foreground">${esc(n.desc)}</span>
                <span class="text-[10px] text-muted-foreground/70">${esc(n.time)} ago</span>
              </a>
            </li>`,
  ).join("");

  return `
      <!-- Topbar ============================================================== -->
      <header
        class="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-card/80 px-4 backdrop-blur-sm dark:bg-background/80 md:px-6"
      >
        <button
          type="button"
          id="sidebar-open"
          aria-label="Open menu"
          class="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:hidden"
        >
          <i data-lucide="menu" class="size-5"></i>
        </button>

        <button
          type="button"
          data-search-trigger
          aria-label="Search pages"
          class="relative hidden h-9 max-w-sm flex-1 items-center rounded-md border border-transparent bg-secondary pl-9 pr-2 text-left text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:border-input focus-visible:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex"
        >
          <i data-lucide="search" class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"></i>
          <span>Search…</span>
          <kbd class="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border bg-card px-1.5 font-mono text-[10px] text-muted-foreground md:inline-block">⌘K</kbd>
        </button>

        <div class="ml-auto flex items-center gap-1">
          <button
            type="button"
            data-search-trigger
            aria-label="Search"
            class="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:hidden"
          >
            <i data-lucide="search" class="size-5"></i>
          </button>

          <button
            type="button"
            aria-label="Language"
            class="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <i data-lucide="globe" class="size-5"></i>
          </button>

          <button
            type="button"
            id="theme-toggle"
            aria-label="Toggle theme"
            class="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <i data-lucide="sun" class="size-5 dark:hidden"></i>
            <i data-lucide="moon" class="hidden size-5 dark:block"></i>
          </button>

          <!-- Notifications -->
          <div class="relative" data-dropdown>
            <button
              type="button"
              data-dropdown-trigger
              aria-expanded="false"
              aria-haspopup="true"
              aria-label="Notifications"
              class="relative inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <i data-lucide="bell" class="size-5"></i>
              <span class="absolute right-2 top-2 size-2 rounded-full bg-destructive ring-2 ring-background"></span>
            </button>
            <div
              data-dropdown-menu
              hidden
              class="absolute right-0 z-50 mt-2 w-80 origin-top-right rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg"
            >
              <div class="flex items-center justify-between px-2 py-1.5">
                <span class="text-sm font-semibold">Notifications</span>
                <span class="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">3 new</span>
              </div>
              <div class="-mx-1 my-1 h-px bg-border"></div>
              <ul>${items}
              </ul>
              <div class="-mx-1 my-1 h-px bg-border"></div>
              <a href="#" class="block rounded-md px-2 py-2 text-center text-sm font-medium text-primary transition-colors hover:bg-secondary">
                View all notifications
              </a>
            </div>
          </div>

          <div class="mx-1 h-6 w-px bg-border"></div>

          <!-- Account -->
          <div class="relative" data-dropdown>
            <button
              type="button"
              data-dropdown-trigger
              aria-expanded="false"
              aria-haspopup="true"
              aria-label="Account menu"
              class="flex items-center gap-2 rounded-full pl-1 pr-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <img
                src="https://i.pravatar.cc/80?img=12"
                alt=""
                width="36"
                height="36"
                class="size-9 rounded-full object-cover"
              />
            </button>
            <div
              data-dropdown-menu
              hidden
              class="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg"
            >
              <div class="flex flex-col px-2 py-1.5">
                <span class="truncate text-sm font-semibold text-foreground">Alex Morgan</span>
                <span class="truncate text-xs text-muted-foreground">alex@asoc.dev</span>
              </div>
              <div class="-mx-1 my-1 h-px bg-border"></div>
              <a href="https://asoc-reach-landing-html.vercel.app/profile" class="flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-secondary" target="_blank" rel="noopener noreferrer">
                <i data-lucide="user" class="size-4"></i> Profile
              </a>
              <a href="https://asoc-reach-landing-html.vercel.app/settings/account" class="flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-secondary" target="_blank" rel="noopener noreferrer">
                <i data-lucide="settings" class="size-4"></i> Settings
              </a>
              <div class="-mx-1 my-1 h-px bg-border"></div>
              <a href="https://asoc-reach-landing-html.vercel.app/auth/login" class="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-destructive transition-colors hover:bg-secondary" target="_blank" rel="noopener noreferrer">
                <i data-lucide="log-out" class="size-4"></i> Sign out
              </a>
            </div>
          </div>
        </div>
      </header>`;
}

/* ------------------------------------------------------------------- footer */

function renderFooter() {
  return `
      <!-- Footer ============================================================== -->
      <footer class="border-t bg-card px-6 py-4 text-sm text-muted-foreground dark:bg-background">
        <div class="flex flex-col items-center justify-between gap-2 sm:flex-row">
          <p>
            © <span data-current-year>2026</span>
            <span class="font-medium text-foreground">${esc(site.name)}</span>. Built with HTML, Vite &amp; Tailwind.
          </p>
          <nav aria-label="Footer" class="flex items-center gap-4">
            <a href="https://asoc-reach-landing-html.vercel.app/docs" class="transition-colors hover:text-foreground" target="_blank" rel="noopener noreferrer">Docs</a>
            <a href="https://asoc-reach-landing-html.vercel.app/faq" class="transition-colors hover:text-foreground" target="_blank" rel="noopener noreferrer">Support</a>
            <a href="https://asoc-reach-landing-html.vercel.app/docs" class="transition-colors hover:text-foreground" target="_blank" rel="noopener noreferrer">License</a>
          </nav>
        </div>
      </footer>`;
}

/* ------------------------------------------------------- command palette + head */

function renderSearchDialog() {
  return `
    <!-- Command palette ====================================================== -->
    <div
      id="command-palette"
      hidden
      class="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/50 p-4 pt-[12vh] backdrop-blur-[1px]"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search pages"
        class="w-full max-w-lg overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lg"
      >
        <div class="flex items-center gap-2 border-b px-3">
          <i data-lucide="search" class="size-4 shrink-0 text-muted-foreground"></i>
          <input
            id="command-input"
            type="search"
            placeholder="Search pages…"
            autocomplete="off"
            class="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd class="rounded border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">ESC</kbd>
        </div>
        <ul id="command-results" class="scrollbar-thin max-h-80 overflow-y-auto p-2"></ul>
      </div>
    </div>
    <script type="application/json" id="page-index">${JSON.stringify(pageIndex())}</script>`;
}

function head({ title, description }) {
  return `  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${esc(description)}" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <title>${esc(title)} — ${esc(site.titleSuffix)}</title>
    <script>
      // Mark that JS is actually running, before first paint, so CSS can gate
      // "hide until revealed" rules (see src/js/reveal.js) behind this class
      // instead of behind prefers-reduced-motion alone — otherwise a page whose
      // module script fails to load or throws ships every [data-reveal] section
      // permanently invisible.
      document.documentElement.classList.add("js");
      // Apply the saved theme before first paint so there is no light/dark flash.
      (function () {
        try {
          var t = localStorage.getItem("${site.storagePrefix}-theme") || "system";
          var dark =
            t === "dark" ||
            (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
          document.documentElement.classList.toggle("dark", dark);
          if (localStorage.getItem("${site.storagePrefix}-sidebar") === "collapsed")
            document.documentElement.classList.add("sidebar-collapsed");
        } catch (e) {}
      })();
    </script>
    <script type="module" src="/src/js/main.marketing.js"></script>
  </head>`;
}

/* ------------------------------------------------------------------ layouts */

function appLayout(meta, body) {
  return `${meta.sidebar === false ? "" : renderSidebar(resolveActive(meta.active))}

    <div id="app-content" class="${contentClass(meta)}">
${meta.navbar === false ? "" : renderTopbar(meta)}

      <main id="main" tabindex="-1" class="flex-1 outline-none">
        <div class="${wrapperClass(meta)}">
${meta.navbar === "content" ? renderContentNavbar() : ""}
${meta.contentSidebar ? withContentSidebar(body) : body}
        </div>
      </main>
${renderFooter()}
    </div>
${renderSearchDialog()}`;
}

/** Padding that keeps the content clear of whichever sidebar is in play. */
function contentClass(meta) {
  const base = "flex min-h-screen flex-col transition-[padding] duration-200";
  if (meta.sidebar === false) return base;
  return `${base} lg:pl-64`;
}

/** How wide the content column runs — `wide` (default), `fluid` or `container`. */
function wrapperClass(meta) {
  const pad = "w-full px-4 py-6 md:px-6 md:py-8";
  if (meta.width === "fluid") return `${pad} max-w-none`;
  if (meta.width === "container") return `mx-auto ${pad} max-w-4xl`;
  return `mx-auto ${pad} max-w-screen-2xl`;
}

/**
 * A navbar that sits inside the content column rather than spanning the viewport.
 * Used by the `content-navbar` layout demos.
 */
function renderContentNavbar() {
  return `        <nav class="mb-6 flex items-center gap-2 rounded-xl border bg-card px-4 py-2.5 shadow-sm">
          <a href="https://asoc-reach-landing-html.vercel.app/dashboard/analytics" class="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" target="_blank" rel="noopener noreferrer">Dashboard</a>
          <a href="https://asoc-reach-landing-html.vercel.app/commerce/products" class="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" target="_blank" rel="noopener noreferrer">Products</a>
          <a href="https://asoc-reach-landing-html.vercel.app/commerce/orders" class="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" target="_blank" rel="noopener noreferrer">Orders</a>
          <a href="https://asoc-reach-landing-html.vercel.app/crm/contacts" class="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" target="_blank" rel="noopener noreferrer">Contacts</a>
          <div class="ml-auto flex items-center gap-1">
            <button type="button" data-search-trigger aria-label="Search" class="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <i data-lucide="search" class="size-4"></i>
            </button>
            <button type="button" aria-label="Notifications" class="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <i data-lucide="bell" class="size-4"></i>
            </button>
          </div>
        </nav>`;
}

/** A secondary in-content sidebar beside the page body. */
function withContentSidebar(body) {
  return `        <div class="grid gap-6 lg:grid-cols-[14rem_1fr]">
          <aside class="hidden lg:block">
            <nav class="sticky top-24 space-y-1">
              <p class="px-3 pb-1 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">Section</p>
              <a href="#" aria-current="page" class="block rounded-lg bg-primary/15 px-3 py-2 text-sm font-medium">Overview</a>
              <a href="#" class="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">Details</a>
              <a href="#" class="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">History</a>
              <a href="#" class="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">Settings</a>
            </nav>
          </aside>
          <div>
${body}
          </div>
        </div>`;
}

/**
 * Horizontal layout: the primary navigation runs across the top instead of down
 * the side. Reuses the same nav config, flattened to its group labels.
 */
function horizontalLayout(meta, body) {
  const links = navGroups
    .slice(0, 7)
    .map((group) => {
      const first = group.items[0];
      const href = first.href ?? first.children?.[0]?.href ?? "#";
      return `          <a href="${esc(href)}" class="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">${esc(group.label)}</a>`;
    })
    .join("\n");

  return `    <div class="flex min-h-screen flex-col">
      <header class="sticky top-0 z-20 border-b bg-card/80 backdrop-blur-sm dark:bg-background/80">
        <div class="mx-auto flex h-16 w-full max-w-screen-2xl items-center gap-4 px-4 md:px-6">
          <a href="${esc(site.homeHref)}" class="shrink-0">
            <img src="${site.logo}" alt="${esc(site.name)}" class="h-9 w-auto object-contain" />
          </a>
          <nav aria-label="Main navigation" class="hidden items-center gap-1 lg:flex">
${links}
          </nav>
          <div class="ml-auto flex items-center gap-1">
            <button type="button" data-search-trigger aria-label="Search" class="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <i data-lucide="search" class="size-5"></i>
            </button>
            <button type="button" id="theme-toggle" aria-label="Toggle theme" class="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <i data-lucide="sun" class="size-5 dark:hidden"></i>
              <i data-lucide="moon" class="hidden size-5 dark:block"></i>
            </button>
            <img src="https://i.pravatar.cc/80?img=12" alt="" width="36" height="36" class="size-9 rounded-full object-cover" />
          </div>
        </div>
      </header>
      <main id="main" tabindex="-1" class="flex-1 outline-none">
        <div class="${wrapperClass(meta)}">
${body}
        </div>
      </main>
${renderFooter()}
    </div>
${renderSearchDialog()}`;
}

function authLayout(meta, body) {
  return `    <div id="main" tabindex="-1" class="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <a href="${esc(site.homeHref)}" class="mb-8 inline-flex">
        <img src="${site.logo}" alt="${esc(site.name)}" class="h-12 w-auto object-contain" />
      </a>
${body}
    </div>`;
}

function blankLayout(meta, body) {
  return `    <div id="main" tabindex="-1" class="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10 text-center">
${body}
    </div>`;
}

/* -------------------------------------------------------------- marketing */

/**
 * Renders `site.logo`/`site.logoDark` as a pair, one hidden per theme via
 * `dark:hidden`/`hidden dark:block`. The marketing header/footer sit on
 * `bg-background`, which flips light/dark with the theme toggle — a single-
 * colour logo goes invisible in whichever theme it wasn't drawn for. Falls
 * back to a single `<img>` when an edition hasn't set `logoDark` (the kit's
 * own admin `site.config.js` doesn't).
 */
function themedLogo(cls) {
  if (!site.logoDark) {
    return `<img src="${site.logo}" alt="${esc(site.name)}" class="${cls}" />`;
  }
  return `<img src="${site.logo}" alt="${esc(site.name)}" class="${cls} dark:hidden" />
            <img src="${site.logoDark}" alt="${esc(site.name)}" class="${cls} hidden dark:block" />`;
}

function renderMarketingHeader(active) {
  const link = (item) => {
    const on = active === item.href;
    return `<a href="${esc(item.href)}"${on ? ' aria-current="page"' : ""} class="rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      on ? "text-foreground" : "text-muted-foreground hover:text-foreground"
    }">${esc(item.title)}</a>`;
  };
  return `      <header class="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur">
        <div class="mx-auto flex h-16 w-full max-w-screen-xl items-center justify-between px-4 md:px-6">
          <a href="${esc(site.homeHref)}" class="inline-flex items-center gap-2">
            ${themedLogo("h-8 w-auto object-contain")}
          </a>
          <nav class="hidden items-center gap-1 md:flex" aria-label="Main">
${marketingNav.header.map((i) => `            ${link(i)}`).join("\n")}
          </nav>
          <div class="flex items-center gap-2">
            <button id="theme-toggle" type="button" aria-label="Toggle theme" class="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <i data-lucide="sun-moon"></i>
            </button>
            <button type="button" data-mobile-menu-toggle aria-controls="mobile-menu" aria-expanded="false" aria-label="Open menu" class="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:hidden">
              <i data-lucide="menu"></i>
            </button>
          </div>
        </div>
        <div id="mobile-menu" hidden class="border-t border-border md:hidden">
          <nav class="mx-auto flex w-full max-w-screen-xl flex-col gap-1 px-4 py-3" aria-label="Mobile">
${marketingNav.header.map((i) => `            ${link(i)}`).join("\n")}
          </nav>
        </div>
      </header>`;
}

function renderMarketingFooter() {
  const column = (group) => `            <div>
              <p class="mb-3 text-sm font-semibold text-foreground">${esc(group.label)}</p>
              <ul class="space-y-2">
${group.links.map((l) => `                <li><a href="${esc(l.href)}" class="text-sm text-muted-foreground transition-colors hover:text-foreground">${esc(l.title)}</a></li>`).join("\n")}
              </ul>
            </div>`;
  return `      <footer class="border-t border-border bg-background">
        <div class="mx-auto w-full max-w-screen-xl px-4 py-12 md:px-6">
          <div class="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div>
              ${themedLogo("h-8 w-auto object-contain")}
            </div>
${marketingNav.footer.map(column).join("\n")}
          </div>
          <p class="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
            &copy; <span data-current-year></span> ${esc(site.name)}. All rights reserved.
          </p>
        </div>
      </footer>`;
}

function marketingLayout(meta, body) {
  return `${meta.header === false ? "" : renderMarketingHeader(meta.active)}

      <main id="main" tabindex="-1" class="flex-1 outline-none">
${body}
      </main>
${meta.footer === false ? "" : renderMarketingFooter()}`;
}

// Exported so tests can iterate the actual set of shells (e.g. verifying every
// one's skip-link target exists) instead of a hand-maintained list that a new
// shell could slip past — see test/layout.test.js.
export const LAYOUTS = {
  app: appLayout,
  auth: authLayout,
  blank: blankLayout,
  horizontal: horizontalLayout,
  marketing: marketingLayout,
};

/* -------------------------------------------------------------------- entry */

const META_RE = /^\s*<!--@meta([\s\S]*?)-->/;

export function parseMeta(source) {
  const match = source.match(META_RE);
  if (!match) {
    return [{ title: "Page", layout: "app", description: "" }, source];
  }
  let meta;
  try {
    meta = JSON.parse(match[1]);
  } catch (err) {
    throw new Error(`Invalid @meta JSON block: ${err.message}`);
  }
  return [meta, source.slice(match[0].length)];
}

/** Wrap a page fragment in its layout and return a complete HTML document. */
export function renderPage(source) {
  const [meta, body] = parseMeta(source);
  const layout = LAYOUTS[meta.layout ?? "app"];
  if (!layout) throw new Error(`Unknown layout "${meta.layout}"`);

  // `sidebar: "collapsed"` forces the rail narrow for this page regardless of the
  // visitor's saved preference — the head script only reads localStorage.
  const rootClass =
    meta.sidebar === "collapsed" ? "scroll-smooth sidebar-collapsed" : "scroll-smooth";

  return inlineIcons(`<!doctype html>
<html lang="en" class="${rootClass}">
${head({
  title: meta.title ?? "Page",
  description: meta.description ?? site.description,
})}
  <body class="bg-background font-sans text-foreground antialiased">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg"
      >Skip to content</a
    >
${layout(meta, body.trimEnd())}
  </body>
</html>
`);
}
