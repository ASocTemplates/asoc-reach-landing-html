/**
 * The marketing header's mobile menu.
 *
 * Binds `[data-mobile-menu-toggle]` to the panel named by its `aria-controls`,
 * keeping `aria-expanded` and the panel's `hidden` attribute in sync. Closes on
 * Escape and returns focus to the toggle, so a keyboard visitor is never
 * stranded inside a closed panel. Also closes on clicking any link inside the
 * panel — without this, following a same-page anchor (e.g. `/#pricing`) from
 * the open panel leaves it covering the section it just scrolled to, which on
 * a one-page marketing template is most of what the panel's links do. Closing
 * only sets state; it never calls preventDefault, so the link still navigates.
 *
 * No backdrop click / browser-back handling here on purpose: `build/layout.js`
 * renders this panel as an inline block under the header (`hidden` toggled on
 * `#mobile-menu`), not an overlay — there's no backdrop element to bind, and
 * unlike `modal.js` (a true overlay), nothing else in this module manages
 * history state either.
 */
export function initMobileMenu() {
  document.querySelectorAll("[data-mobile-menu-toggle]").forEach((toggle) => {
    const panel = document.getElementById(toggle.getAttribute("aria-controls"));
    if (!panel) return;

    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      panel.hidden = !open;
    };

    toggle.addEventListener("click", () =>
      setOpen(toggle.getAttribute("aria-expanded") !== "true"),
    );

    panel.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setOpen(false));
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (toggle.getAttribute("aria-expanded") !== "true") return;
      setOpen(false);
      toggle.focus();
    });
  });
}
