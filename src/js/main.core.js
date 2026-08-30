/**
 * The behaviours EVERY edition ships, admin or marketing.
 *
 * Split out from `main.js` so a landing or shop edition can delete the
 * admin-only modules (sidebar, command palette, tables, charts, maps…) and boot
 * from here alone. Fonts and CSS are imported by the edition's own `main.js`,
 * because which font families ship is a per-edition decision.
 */
import { initTheme } from "./theme.js";
import { initDropdowns } from "./dropdown.js";
import { initCollapse } from "./collapse.js";
import { initTabs } from "./tabs.js";
import { initModals } from "./modal.js";
import { initForms } from "./forms.js";
import { initToasts } from "./toast.js";
import { initCarousels } from "./carousel.js";
import { initReveal } from "./reveal.js";
import { initMobileMenu } from "./mobile-menu.js";

export function bootCore() {
  initTheme();
  initDropdowns();
  initCollapse();
  initTabs();
  initModals();
  initForms();
  initToasts();
  initCarousels();
  initReveal();
  initMobileMenu();

  // Footer copyright year, so a static build never shows a stale year.
  const year = String(new Date().getFullYear());
  document.querySelectorAll("[data-current-year]").forEach((el) => {
    el.textContent = year;
  });
}
