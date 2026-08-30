/**
 * Collapsible sections — the sidebar's expandable nav groups and the accordion
 * component share this one behavior.
 *
 *   <button data-collapse-trigger aria-expanded="false">…</button>
 *   <div data-collapse-panel class="hidden">…</div>
 *
 * The panel is the trigger's next element sibling. Add `data-collapse-group` on a
 * shared ancestor to make the children behave like an accordion (one open at a time).
 */
export function initCollapse() {
  document.querySelectorAll("[data-collapse-trigger]").forEach((trigger) => {
    const panel = trigger.nextElementSibling;
    if (!panel?.hasAttribute("data-collapse-panel")) return;

    trigger.addEventListener("click", () => {
      const open = trigger.getAttribute("aria-expanded") === "true";
      const group = trigger.closest("[data-collapse-group]");

      if (group && !open) {
        group.querySelectorAll("[data-collapse-trigger]").forEach((other) => {
          if (other === trigger) return;
          other.setAttribute("aria-expanded", "false");
          other.nextElementSibling?.classList.add("hidden");
          other
            .querySelector("[data-collapse-chevron]")
            ?.classList.remove("rotate-90", "rotate-180");
        });
      }

      trigger.setAttribute("aria-expanded", String(!open));
      panel.classList.toggle("hidden", open);
      trigger.querySelector("[data-collapse-chevron]")?.classList.toggle("rotate-180", !open);
      // The sidebar's own chevron rotates 90°, not 180°.
      trigger.querySelector(".lucide-chevron-right")?.classList.toggle("rotate-90", !open);
    });
  });
}
