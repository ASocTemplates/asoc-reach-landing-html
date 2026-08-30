/**
 * Toasts — transient messages stacked in a corner.
 *
 * Trigger from markup, no JS required:
 *   <button data-toast='{"title":"Saved","description":"…","tone":"success"}'>Save</button>
 *
 * Or from your own code:
 *   import { toast } from "./toast.js";
 *   toast({ title: "Saved", tone: "success" });
 *
 * The container is created on first use and reused after that. `tone` is one of
 * neutral (default), success, warning, danger or info.
 */
const TONES = {
  neutral: { icon: "bell", classes: "text-foreground" },
  success: { icon: "circle-check-big", classes: "text-success" },
  warning: { icon: "triangle-alert", classes: "text-warning" },
  danger: { icon: "octagon-alert", classes: "text-destructive" },
  info: { icon: "info", classes: "text-info" },
};

/** Icons are inlined at build time, so the runtime keeps its own tiny set. */
const ICON_PATHS = {
  bell: '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
  "circle-check-big": '<path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/>',
  "triangle-alert":
    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  "octagon-alert":
    '<path d="M12 16h.01"/><path d="M12 8v4"/><path d="M15.312 2a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586l-4.688-4.688A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2z"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
};

const svg = (name, cls) =>
  `<svg aria-hidden="true" class="${cls}" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name]}</svg>`;

function container() {
  let el = document.getElementById("toast-region");
  if (el) return el;
  el = document.createElement("div");
  el.id = "toast-region";
  el.setAttribute("role", "region");
  el.setAttribute("aria-label", "Notifications");
  el.className =
    "pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-3";
  document.body.append(el);
  return el;
}

export function toast({ title, description, tone = "neutral", duration = 4000 } = {}) {
  const { icon, classes } = TONES[tone] ?? TONES.neutral;
  const el = document.createElement("div");
  el.setAttribute("role", tone === "danger" ? "alert" : "status");
  el.className =
    "pointer-events-auto flex animate-fade-up items-start gap-3 rounded-xl border bg-card p-4 text-card-foreground shadow-lg";
  el.innerHTML = `
    ${svg(icon, `mt-0.5 size-5 shrink-0 ${classes}`)}
    <div class="min-w-0 flex-1">
      ${title ? `<p class="text-sm font-medium">${title}</p>` : ""}
      ${description ? `<p class="mt-0.5 text-sm text-muted-foreground">${description}</p>` : ""}
    </div>
    <button type="button" data-toast-close aria-label="Dismiss" class="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
      ${svg("x", "size-4")}
    </button>`;

  const dismiss = () => {
    el.style.opacity = "0";
    el.style.transition = "opacity 150ms";
    setTimeout(() => el.remove(), 150);
  };

  el.querySelector("[data-toast-close]").addEventListener("click", dismiss);
  container().append(el);
  if (duration > 0) setTimeout(dismiss, duration);
  return el;
}

export function initToasts() {
  document.querySelectorAll("[data-toast]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      try {
        toast(JSON.parse(trigger.dataset.toast));
      } catch {
        // A bare `data-toast` with no JSON still shows something useful.
        toast({ title: trigger.dataset.toast || "Notification" });
      }
    });
  });
}
