/**
 * Dev-time page scaffolder — NOT part of the build.
 *
 * `node build/scaffold.js <spec.js>` writes plain HTML page fragments into `pages/`
 * from a compact spec. The output is ordinary hand-editable markup using the same
 * Tailwind classes as every other page: this exists so the boilerplate (page header,
 * card chrome, table chrome, pagination footer) is written once instead of retyped
 * per page. Once a page is generated you own it — edit the HTML, not the spec.
 *
 * A spec module default-exports `{ "<page/path>": { title, layout, active,
 * description, sections: [...] } }`. Section kinds: header, kpis, chart, table,
 * list, progress, timeline, cards, form, split, demo, prose, plus the marketing
 * set — hero, features, pricing, testimonials, faq, cta, logo-wall — for landing
 * and shop editions (pair with `layout: "marketing"`).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const esc = (s) =>
  String(s ?? "")
    .replace(/&(?!(amp|lt|gt|quot|#\d+|[a-z]+);)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const icon = (name, cls = "size-4") => (name ? `<i data-lucide="${name}" class="${cls}"></i>` : "");

/** JSON for a single-quoted HTML attribute — an apostrophe in the data would
    otherwise close the attribute early (e.g. a category label like "Q1'25"). */
const attrJson = (value) =>
  JSON.stringify(value).replace(/&/g, "&amp;").replace(/'/g, "&#39;").replace(/</g, "&lt;");

const ACCENT = {
  primary: ["bg-primary/10", "text-primary"],
  accent: ["bg-accent/15", "text-accent"],
  info: ["bg-info/12", "text-info"],
  success: ["bg-success/12", "text-success"],
  warning: ["bg-warning/15", "text-warning"],
  danger: ["bg-destructive/12", "text-destructive"],
};

const BADGE = {
  success: "bg-success/12 text-success",
  warning: "bg-warning/15 text-warning",
  info: "bg-info/12 text-info",
  danger: "bg-destructive/12 text-destructive",
  neutral: "bg-secondary text-muted-foreground",
  primary: "bg-primary/10 text-primary",
};

const card = (body, extra = "") =>
  `<div class="rounded-xl border bg-card text-card-foreground shadow-sm${extra ? ` ${extra}` : ""}">\n${body}\n</div>`;

const cardHead = (
  title,
  desc,
  right = "",
) => `  <div class="flex items-start justify-between gap-4 p-6 pb-4">
    <div>
      <div class="text-base font-semibold leading-tight">${esc(title)}</div>
      ${desc ? `<div class="text-sm text-muted-foreground">${esc(desc)}</div>` : ""}
    </div>${right ? `\n    ${right}` : ""}
  </div>`;

/* ------------------------------------------------------------------ sections */

function header({ title, description, crumbs = [], actions = [] }) {
  // The separator follows position, not whether a crumb happens to be a link —
  // tying it to `href` silently ran unlinked crumbs together ("UI UI Elements").
  const crumbHtml = crumbs.length
    ? `    <nav aria-label="Breadcrumb" class="flex items-center gap-1 text-sm text-muted-foreground">
${crumbs
  .map((c, i) => {
    const last = i === crumbs.length - 1;
    const item = c.href
      ? `      <a href="${c.href}" class="transition-colors hover:text-foreground">${esc(c.label)}</a>`
      : `      <span${last ? ' class="text-foreground"' : ""}>${esc(c.label)}</span>`;
    return last ? item : `${item}\n      ${icon("chevron-right", "size-3.5")}`;
  })
  .join("\n")}
    </nav>`
    : "";

  const actionHtml = actions.length
    ? `  <div class="flex shrink-0 items-center gap-2">
${actions
  .map((a) => {
    const cls =
      a.variant === "primary"
        ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
        : "border bg-card hover:bg-secondary";
    const tag = a.href ? "a" : "button";
    const attrs = a.href ? `href="${a.href}"` : 'type="button"';
    return `    <${tag} ${attrs} class="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors ${cls}">
      ${icon(a.icon)}
      ${esc(a.label)}
    </${tag}>`;
  })
  .join("\n")}
  </div>`
    : "";

  return `<!-- Page header ============================================================ -->
<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
  <div class="space-y-1">
${crumbHtml}
    <h1 class="text-2xl font-bold tracking-tight">${esc(title)}</h1>
    ${description ? `<p class="text-sm text-muted-foreground">${esc(description)}</p>` : ""}
  </div>
${actionHtml}
</div>`;
}

function kpis({ items }) {
  const cols = items.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2 xl:grid-cols-4";
  return `<div class="mb-6 grid gap-6 ${cols}">
${items
  .map((k) => {
    const [bg, fg] = ACCENT[k.accent ?? "primary"];
    const up = k.delta != null && !String(k.delta).startsWith("-");
    const good = k.deltaGood ?? up;
    const delta =
      k.delta != null
        ? `      <span class="inline-flex items-center gap-0.5 text-xs font-semibold ${good ? "text-success" : "text-destructive"}">
        ${icon(up ? "arrow-up-right" : "arrow-down-right", "size-3.5")}${esc(String(k.delta).replace(/^-/, ""))}
      </span>`
        : "";
    return `  <div class="rounded-xl border bg-card p-5 text-card-foreground shadow-sm">
    <div class="flex items-start justify-between">
      <div class="flex size-11 items-center justify-center rounded-xl ${bg}">${icon(k.icon, `size-5 ${fg}`)}</div>
${delta}
    </div>
    <div class="mt-4">
      <p class="text-sm text-muted-foreground">${esc(k.label)}</p>
      <p class="mt-1 text-2xl font-bold tracking-tight tabular-nums">${esc(k.value)}</p>
      ${k.sub ? `<p class="mt-1 text-xs text-muted-foreground">${esc(k.sub)}</p>` : ""}
    </div>
  </div>`;
  })
  .join("\n")}
</div>`;
}

function chart({ title, description, chart: config, legend = [] }) {
  const right = legend.length
    ? `<div class="flex items-center gap-3 text-xs text-muted-foreground">
      ${legend.map((l) => `<span class="flex items-center gap-1.5"><span class="size-2 rounded-full bg-${l.color}"></span>${esc(l.label)}</span>`).join("\n      ")}
    </div>`
    : "";
  return card(`${cardHead(title, description, right)}
  <div class="p-6 pt-0">
    <div data-chart='${attrJson(config)}'></div>
  </div>`);
}

function cell(c) {
  if (c == null) return `    <td class="px-6 py-3"></td>`;
  if (typeof c !== "object") return `    <td class="px-6 py-3">${esc(c)}</td>`;
  if (c.badge) {
    return `    <td class="px-6 py-3"><span class="inline-flex rounded-full ${BADGE[c.badge]} px-2 py-0.5 text-xs font-medium">${esc(c.t)}</span></td>`;
  }
  if (c.avatar) {
    const [bg, fg] = ACCENT[c.accent ?? "primary"];
    return `    <td class="px-6 py-3">
      <div class="flex items-center gap-3">
        <span class="flex size-9 shrink-0 items-center justify-center rounded-lg ${bg} text-xs font-semibold ${fg}">${esc(c.avatar)}</span>
        <div>
          <p class="font-medium">${esc(c.t)}</p>
          ${c.sub ? `<p class="text-xs text-muted-foreground">${esc(c.sub)}</p>` : ""}
        </div>
      </div>
    </td>`;
  }
  const align = c.align === "right" ? " text-right tabular-nums" : "";
  const tone = c.tone ? ` text-${c.tone}` : c.muted ? " text-muted-foreground" : "";
  const strong = c.strong ? " font-medium" : "";
  const value = c.value != null ? ` data-value="${esc(c.value)}"` : "";
  return `    <td class="px-6 py-3${align}${tone}${strong}"${value}>${esc(c.t)}</td>`;
}

function table({
  title,
  description,
  columns,
  rows,
  pageSize = 8,
  search = true,
  searchLabel = "Search…",
  empty = "Nothing matches that search.",
}) {
  const searchBox = search
    ? `    <div class="relative sm:w-64">
      ${icon("search", "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground")}
      <input
        type="search"
        data-table-search
        placeholder="${esc(searchLabel)}"
        aria-label="${esc(searchLabel)}"
        class="h-9 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
      />
    </div>`
    : "";

  return `<div class="rounded-xl border bg-card text-card-foreground shadow-sm" data-table data-page-size="${pageSize}">
  <div class="flex flex-col gap-3 p-6 pb-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <div class="text-base font-semibold leading-tight">${esc(title)}</div>
      ${description ? `<div class="text-sm text-muted-foreground">${esc(description)}</div>` : ""}
    </div>
${searchBox}
  </div>

  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead class="border-y bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
        <tr>
${columns
  .map((c) => {
    const align = c.align === "right" ? "text-right" : "text-left";
    const sort = c.sort ? ` data-sort="${c.sort}" aria-sort="none"` : "";
    return `          <th scope="col"${sort} class="px-6 py-3 ${align} font-semibold">${esc(c.label)}</th>`;
  })
  .join("\n")}
        </tr>
      </thead>
      <tbody class="divide-y">
${rows
  .map(
    (r) =>
      `        <tr class="transition-colors hover:bg-secondary/40">\n${r.map((c) => `    ${cell(c)}`).join("\n")}\n        </tr>`,
  )
  .join("\n")}
      </tbody>
    </table>
    <p data-table-empty hidden class="px-6 py-10 text-center text-sm text-muted-foreground">${esc(empty)}</p>
  </div>

  <div class="flex flex-col items-center justify-between gap-3 border-t px-6 py-4 sm:flex-row">
    <p data-table-info class="text-sm text-muted-foreground"></p>
    <div data-table-pagination class="flex items-center gap-1"></div>
  </div>
</div>`;
}

function list({ title, description, items, footer }) {
  return card(`  <div class="p-6 pb-2">
    <div class="text-base font-semibold leading-tight">${esc(title)}</div>
    ${description ? `<div class="text-sm text-muted-foreground">${esc(description)}</div>` : ""}
  </div>
  <ul class="divide-y">
${items
  .map((i) => {
    const [bg, fg] = ACCENT[i.accent ?? "primary"];
    return `    <li class="flex items-center gap-3 px-6 py-3.5">
      ${i.avatar ? `<span class="flex size-10 shrink-0 items-center justify-center rounded-lg ${bg} text-xs font-semibold ${fg}">${esc(i.avatar)}</span>` : i.icon ? `<span class="flex size-10 shrink-0 items-center justify-center rounded-lg ${bg}">${icon(i.icon, `size-5 ${fg}`)}</span>` : ""}
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium">${esc(i.title)}</p>
        ${i.sub ? `<p class="text-xs text-muted-foreground">${esc(i.sub)}</p>` : ""}
      </div>
      ${
        i.right
          ? `<div class="text-right">
        <p class="text-sm font-semibold tabular-nums">${esc(i.right)}</p>
        ${i.rightSub ? `<p class="text-xs ${i.rightTone ? `text-${i.rightTone}` : "text-muted-foreground"}">${esc(i.rightSub)}</p>` : ""}
      </div>`
          : ""
      }
    </li>`;
  })
  .join("\n")}
  </ul>
${
  footer
    ? `  <div class="border-t p-4">
    <a href="${footer.href}" class="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-secondary">
      ${esc(footer.label)}
      ${icon("arrow-right")}
    </a>
  </div>`
    : ""
}`);
}

function progress({ title, description, items }) {
  return card(`  <div class="p-6 pb-0">
    <div class="text-base font-semibold leading-tight">${esc(title)}</div>
    ${description ? `<div class="text-sm text-muted-foreground">${esc(description)}</div>` : ""}
  </div>
  <div class="space-y-5 p-6">
${items
  .map(
    (i) => `    <div>
      <div class="flex items-center justify-between text-sm">
        <span class="font-medium">${esc(i.label)}</span>
        <span class="tabular-nums text-muted-foreground">${esc(i.value)}</span>
      </div>
      <div class="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
        <div class="h-full rounded-full bg-${i.color ?? "primary"}" style="width: ${i.pct}%"></div>
      </div>
    </div>`,
  )
  .join("\n")}
  </div>`);
}

function timeline({ title, description, items, footer }) {
  return card(`  <div class="p-6 pb-2">
    <div class="text-base font-semibold leading-tight">${esc(title)}</div>
    ${description ? `<div class="text-sm text-muted-foreground">${esc(description)}</div>` : ""}
  </div>
  <div class="p-6 pt-4">
    <ol class="relative space-y-6 border-l border-border pl-6">
${items
  .map(
    (i) => `      <li class="relative">
        <span class="absolute -left-[1.6875rem] top-1 flex size-3 rounded-full bg-${i.color ?? "primary"} ring-4 ring-card"></span>
        <p class="text-sm font-medium">${esc(i.title)}</p>
        <p class="text-xs text-muted-foreground">${esc(i.sub)}</p>
      </li>`,
  )
  .join("\n")}
    </ol>
  </div>
${
  footer
    ? `  <div class="border-t p-4">
    <a href="${footer.href}" class="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-secondary">
      ${esc(footer.label)}
      ${icon("arrow-right")}
    </a>
  </div>`
    : ""
}`);
}

function cards({ title, description, columns = 3, items }) {
  return `<div class="mb-6">
  ${
    title
      ? `<div class="mb-4">
    <h2 class="text-lg font-semibold tracking-tight">${esc(title)}</h2>
    ${description ? `<p class="text-sm text-muted-foreground">${esc(description)}</p>` : ""}
  </div>`
      : ""
  }
  <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-${columns}">
${items
  .map((i) => {
    const [bg, fg] = ACCENT[i.accent ?? "primary"];
    return `    <div class="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
      <div class="flex items-start justify-between gap-3">
        <div class="flex size-11 items-center justify-center rounded-xl ${bg}">${icon(i.icon, `size-5 ${fg}`)}</div>
        ${i.badge ? `<span class="inline-flex rounded-full ${BADGE[i.badge.tone ?? "neutral"]} px-2 py-0.5 text-xs font-medium">${esc(i.badge.label)}</span>` : ""}
      </div>
      <h3 class="mt-4 text-base font-semibold leading-tight">${esc(i.title)}</h3>
      ${i.description ? `<p class="mt-1 text-sm text-muted-foreground">${esc(i.description)}</p>` : ""}
      ${
        i.meta
          ? `<dl class="mt-4 grid grid-cols-2 gap-3 border-t pt-4">
${i.meta
  .map(
    (m) => `        <div>
          <dt class="text-xs text-muted-foreground">${esc(m.label)}</dt>
          <dd class="mt-0.5 text-sm font-semibold tabular-nums">${esc(m.value)}</dd>
        </div>`,
  )
  .join("\n")}
      </dl>`
          : ""
      }
      ${i.href ? `<a href="${i.href}" class="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">${esc(i.cta ?? "Open")}${icon("arrow-right")}</a>` : ""}
    </div>`;
  })
  .join("\n")}
  </div>
</div>`;
}

function form({ title, description, fields, actions = [] }) {
  return card(`${cardHead(title, description)}
  <form class="space-y-4 p-6 pt-0">
${fields
  .map((f) => {
    const id = f.id ?? f.label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const base =
      "w-full rounded-lg border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";
    let control;
    if (f.type === "textarea") {
      control = `      <textarea id="${id}" data-autosize rows="${f.rows ?? 3}" placeholder="${esc(f.placeholder ?? "")}" class="${base} resize-none py-2"></textarea>`;
    } else if (f.type === "select") {
      control = `      <select id="${id}" class="${base} h-10">
${f.options.map((o) => `        <option>${esc(o)}</option>`).join("\n")}
      </select>`;
    } else if (f.type === "switch") {
      return `    <label class="flex items-start justify-between gap-4 rounded-lg border p-4">
      <span>
        <span class="block text-sm font-medium">${esc(f.label)}</span>
        ${f.hint ? `<span class="block text-xs text-muted-foreground">${esc(f.hint)}</span>` : ""}
      </span>
      <input type="checkbox" ${f.checked ? "checked " : ""}class="mt-0.5 size-4 shrink-0 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring/30" />
    </label>`;
    } else {
      control = `      <input id="${id}" type="${f.type ?? "text"}" placeholder="${esc(f.placeholder ?? "")}" class="${base} h-10" />`;
    }
    return `    <div class="space-y-1.5">
      <label for="${id}" class="text-sm font-medium">${esc(f.label)}</label>
${control}
      ${f.hint ? `<p class="text-xs text-muted-foreground">${esc(f.hint)}</p>` : ""}
    </div>`;
  })
  .join("\n")}
  </form>
${
  actions.length
    ? `  <div class="flex items-center justify-end gap-2 border-t p-6">
${actions
  .map(
    (a) =>
      `    <button type="button" class="inline-flex h-9 items-center rounded-lg px-4 text-sm font-medium transition-colors ${
        a.variant === "primary"
          ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
          : "border bg-card hover:bg-secondary"
      }">${esc(a.label)}</button>`,
  )
  .join("\n")}
  </div>`
    : ""
}`);
}

/**
 * A component showcase block: a titled card whose body is raw markup, optionally
 * followed by the same markup shown as copyable source.
 *
 *   { kind: "demo", title: "Sizes", description: "…", html: "<button …>", code: true }
 *
 * `html` is emitted verbatim — this is the one section that does not escape its
 * content, because on these pages the markup IS the content.
 */
function demo({
  title,
  description,
  html,
  code = false,
  class: cls = "flex flex-wrap items-center gap-3",
}) {
  return card(`${cardHead(title, description)}
  <div class="p-6 pt-0">
    <div class="${cls}">
${html}
    </div>
${
  code
    ? `    <details class="mt-4 rounded-lg border">
      <summary class="cursor-pointer select-none px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Show markup</summary>
      <pre class="scrollbar-thin overflow-x-auto border-t bg-secondary/50 p-4 font-mono text-xs leading-relaxed"><code>${esc(html.trim())}</code></pre>
    </details>`
    : ""
}
  </div>`);
}

/** A plain prose block, for the explanatory copy on showcase pages. */
function prose({ title, description, html }) {
  return card(`${cardHead(title, description)}
  <div class="p-6 pt-0 text-sm leading-relaxed text-muted-foreground">
${html}
  </div>`);
}

/* -------------------------------------------------------- marketing sections */

/**
 * Landing/shop-page section kinds. Each owns a full-width `<section data-reveal>`
 * with its own centered container, so a spec author never hand-writes that shell —
 * matching how `header`/`kpis`/etc. above own their outer element. Every array
 * field (`items`, `tiers`, `logos`, `actions`) defaults to empty so a minimal spec
 * (just `title`) still renders a valid section; fill the array in once real copy
 * exists.
 */

const sectionHead = (
  title,
  description,
  eyebrow,
) => `    <div class="mx-auto max-w-2xl text-center">
      ${eyebrow ? `<p class="text-sm font-semibold uppercase tracking-wider text-primary">${esc(eyebrow)}</p>` : ""}
      <h2 class="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">${esc(title)}</h2>
      ${description ? `<p class="mt-4 text-base text-muted-foreground">${esc(description)}</p>` : ""}
    </div>`;

/** Shares its `{label, href, icon, variant}` shape with `header()`'s actions. */
function ctaButtons(actions, { primary, outline }) {
  if (!actions.length) return "";
  return actions
    .map(
      (
        a,
      ) => `        <a href="${a.href ?? "#"}" class="inline-flex h-11 items-center gap-2 rounded-lg px-5 text-sm font-semibold transition-colors ${a.variant === "outline" ? outline : primary}">
          ${icon(a.icon)}
          ${esc(a.label)}
        </a>`,
    )
    .join("\n");
}

function hero({ title, description, eyebrow, badge, actions = [] }) {
  const buttons = ctaButtons(actions, {
    primary: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
    outline: "border bg-card hover:bg-secondary",
  });
  return `<section data-reveal class="border-b border-border bg-background">
  <div class="mx-auto max-w-screen-xl px-4 py-20 text-center sm:py-28 md:px-6">
    ${badge ? `<span class="inline-flex items-center rounded-full border bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">${esc(badge)}</span>` : ""}
    ${eyebrow ? `<p class="mt-4 text-sm font-semibold uppercase tracking-wider text-primary">${esc(eyebrow)}</p>` : ""}
    <h1 class="mt-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">${esc(title)}</h1>
    ${description ? `<p class="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">${esc(description)}</p>` : ""}
    ${buttons ? `<div class="mt-8 flex flex-wrap items-center justify-center gap-3">\n${buttons}\n    </div>` : ""}
  </div>
</section>`;
}

function features({ title, description, eyebrow, columns = 3, items = [] }) {
  const grid = items.length
    ? `<div class="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-${columns}">
${items
  .map((i) => {
    const [bg, fg] = ACCENT[i.accent ?? "primary"];
    return `      <div>
        <div class="flex size-11 items-center justify-center rounded-xl ${bg}">${icon(i.icon, `size-5 ${fg}`)}</div>
        <h3 class="mt-4 text-base font-semibold leading-tight">${esc(i.title)}</h3>
        ${i.description ? `<p class="mt-1 text-sm text-muted-foreground">${esc(i.description)}</p>` : ""}
      </div>`;
  })
  .join("\n")}
    </div>`
    : "";
  return `<section data-reveal>
  <div class="mx-auto max-w-screen-xl px-4 py-16 sm:py-20 md:px-6">
${sectionHead(title, description, eyebrow)}
    ${grid}
  </div>
</section>`;
}

function pricing({ title, description, eyebrow, tiers = [] }) {
  const grid = tiers.length
    ? `<div class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-${Math.min(tiers.length, 4)}">
${tiers
  .map(
    (
      t,
    ) => `      <div class="flex flex-col rounded-xl border bg-card p-6 text-card-foreground shadow-sm${t.highlight ? " ring-2 ring-primary" : ""}">
        ${t.highlight ? `<span class="mb-2 inline-flex w-fit rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">${esc(t.highlight === true ? "Most popular" : t.highlight)}</span>` : ""}
        <h3 class="text-base font-semibold leading-tight">${esc(t.name)}</h3>
        <p class="mt-2 flex items-baseline gap-1">
          <span class="text-3xl font-bold tracking-tight">${esc(t.price)}</span>
          ${t.period ? `<span class="text-sm text-muted-foreground">/${esc(t.period)}</span>` : ""}
        </p>
        ${t.description ? `<p class="mt-2 text-sm text-muted-foreground">${esc(t.description)}</p>` : ""}
        ${
          t.features?.length
            ? `<ul class="mt-6 space-y-2.5 text-sm">
${t.features.map((f) => `          <li class="flex items-start gap-2">${icon("check", "mt-0.5 size-4 shrink-0 text-primary")}<span>${esc(f)}</span></li>`).join("\n")}
        </ul>`
            : ""
        }
        <a href="${t.cta?.href ?? "#"}" class="mt-6 inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold transition-colors ${t.highlight ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" : "border bg-card hover:bg-secondary"}">${esc(t.cta?.label ?? "Get started")}</a>
      </div>`,
  )
  .join("\n")}
    </div>`
    : "";
  return `<section data-reveal>
  <div class="mx-auto max-w-screen-xl px-4 py-16 sm:py-20 md:px-6">
${sectionHead(title, description, eyebrow)}
    ${grid}
  </div>
</section>`;
}

function testimonials({ title, description, eyebrow, items = [] }) {
  const grid = items.length
    ? `<div class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
${items
  .map((t) => {
    const [bg, fg] = ACCENT[t.accent ?? "primary"];
    const initials = t.avatar ?? (t.name ?? "").slice(0, 2).toUpperCase();
    return `      <figure class="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
        <blockquote class="text-sm leading-relaxed text-foreground">${esc(t.quote)}</blockquote>
        <figcaption class="mt-4 flex items-center gap-3">
          <span class="flex size-10 shrink-0 items-center justify-center rounded-full ${bg} text-xs font-semibold ${fg}">${esc(initials)}</span>
          <div>
            <p class="text-sm font-medium">${esc(t.name)}</p>
            ${t.role ? `<p class="text-xs text-muted-foreground">${esc(t.role)}</p>` : ""}
          </div>
        </figcaption>
      </figure>`;
  })
  .join("\n")}
    </div>`
    : "";
  return `<section data-reveal>
  <div class="mx-auto max-w-screen-xl px-4 py-16 sm:py-20 md:px-6">
${sectionHead(title, description, eyebrow)}
    ${grid}
  </div>
</section>`;
}

/** Renders as `data-collapse` accordion markup (button + sibling panel, per
    `src/js/collapse.js`) — no inline script, matching every other behavior in
    this kit. `data-collapse-group` makes it one-open-at-a-time. */
function faq({ title, description, eyebrow, items = [] }) {
  const list = items.length
    ? `<div class="mt-8 divide-y divide-border border-t border-border" data-collapse-group>
${items
  .map(
    (i) => `      <div class="py-4">
        <button type="button" data-collapse-trigger aria-expanded="false" class="flex w-full items-center justify-between gap-4 text-left text-sm font-medium">
          <span>${esc(i.q)}</span>
          <i data-lucide="chevron-down" data-collapse-chevron class="size-4 shrink-0 text-muted-foreground transition-transform"></i>
        </button>
        <div data-collapse-panel class="hidden mt-2 pr-8 text-sm text-muted-foreground">
          ${esc(i.a)}
        </div>
      </div>`,
  )
  .join("\n")}
    </div>`
    : "";
  return `<section data-reveal>
  <div class="mx-auto max-w-screen-xl px-4 py-16 sm:py-20 md:px-6">
${sectionHead(title, description, eyebrow)}
    ${list}
  </div>
</section>`;
}

function cta({ title, description, actions = [] }) {
  const buttons = ctaButtons(actions, {
    primary: "bg-primary-foreground text-primary shadow-sm hover:bg-primary-foreground/90",
    outline:
      "border border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10",
  });
  return `<section data-reveal class="bg-primary text-primary-foreground">
  <div class="mx-auto max-w-screen-xl px-4 py-16 text-center sm:py-20 md:px-6">
    <h2 class="text-3xl font-bold tracking-tight sm:text-4xl">${esc(title)}</h2>
    ${description ? `<p class="mx-auto mt-4 max-w-2xl text-base text-primary-foreground/80">${esc(description)}</p>` : ""}
    ${buttons ? `<div class="mt-8 flex flex-wrap items-center justify-center gap-3">\n${buttons}\n    </div>` : ""}
  </div>
</section>`;
}

function logoWall({ title, logos = [] }) {
  const row = logos.length
    ? `<div class="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
${logos
  .map((l) => {
    const name = typeof l === "string" ? l : l.name;
    const logoIcon = typeof l === "object" ? l.icon : null;
    return `      <span class="flex items-center gap-2 text-sm font-semibold text-muted-foreground grayscale transition-all hover:text-foreground hover:grayscale-0">${icon(logoIcon, "size-5")}${esc(name)}</span>`;
  })
  .join("\n")}
    </div>`
    : "";
  return `<section data-reveal class="border-y border-border bg-secondary/30">
  <div class="mx-auto max-w-screen-xl px-4 py-10 md:px-6">
    ${title ? `<p class="text-center text-sm font-medium text-muted-foreground">${esc(title)}</p>` : ""}
    ${row}
  </div>
</section>`;
}

const BUILDERS = {
  header,
  kpis,
  chart,
  table,
  list,
  progress,
  timeline,
  cards,
  form,
  demo,
  prose,
  hero,
  features,
  pricing,
  testimonials,
  faq,
  cta,
  "logo-wall": logoWall,
};

/** A row of side-by-side sections: { kind: "split", cols: "2-1", parts: [section, section] } */
function split({ cols = "2-1", parts }) {
  const spans =
    cols === "2-1" ? ["lg:col-span-2", ""] : cols === "1-2" ? ["", "lg:col-span-2"] : ["", ""];
  const grid = cols === "1-1" ? "lg:grid-cols-2" : "lg:grid-cols-3";
  return `<div class="mb-6 grid gap-6 ${grid}">
${parts
  .map((part, i) => {
    const html = render(part);
    return spans[i] ? html.replace(/^<div class="/, `<div class="${spans[i]} `) : html;
  })
  .join("\n")}
</div>`;
}
BUILDERS.split = split;

function render(section) {
  const build = BUILDERS[section.kind];
  if (!build) throw new Error(`Unknown section kind "${section.kind}"`);
  return build(section);
}

/** Render a page's `sections` array to concatenated HTML. The one renderer the
    CLI below and `test/scaffold.test.js` both call, so there is no second copy
    of the section-kind dispatch to drift out of sync. */
export function renderSections(sections) {
  return sections.map(render).join("\n\n");
}

/* -------------------------------------------------------------------- entry */

// Guarded so `import { renderSections } from "./scaffold.js"` (the tests) can
// load this module without also running the CLI, which expects a spec-file
// argument that a test run never provides.
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const specPath = process.argv[2];
  if (!specPath) throw new Error("usage: node build/scaffold.js <spec.js>");

  const { default: spec } = await import(path.resolve(specPath));

  let written = 0;
  for (const [href, page] of Object.entries(spec)) {
    const file = path.join(root, "pages", `${href.replace(/^\//, "")}.html`);
    fs.mkdirSync(path.dirname(file), { recursive: true });

    const meta = JSON.stringify(
      {
        title: page.title,
        layout: page.layout,
        active: page.active ?? href,
        description: page.description,
      },
      null,
      2,
    );
    const body = renderSections(page.sections);
    fs.writeFileSync(file, `<!--@meta\n${meta}\n-->\n${body}\n`);
    written += 1;
  }
  console.log(`scaffolded ${written} page(s)`);
}
