/**
 * Tabs.
 *
 *   <div data-tabs>
 *     <div role="tablist">
 *       <button role="tab" aria-selected="true" data-tab="overview">Overview</button>
 *     </div>
 *     <div role="tabpanel" data-tab-panel="overview">…</div>
 *   </div>
 *
 * Selected state is expressed with `aria-selected`, which the markup styles via
 * `aria-selected:*` Tailwind variants — so there are no class lists to keep in sync.
 * Arrow keys move between tabs, matching the WAI-ARIA tabs pattern.
 */
export function initTabs() {
  document.querySelectorAll("[data-tabs]").forEach((root) => {
    const tabs = [...root.querySelectorAll('[role="tab"]')];
    const panels = [...root.querySelectorAll("[data-tab-panel]")];
    if (!tabs.length) return;

    const select = (name) => {
      tabs.forEach((tab) => {
        const active = tab.dataset.tab === name;
        tab.setAttribute("aria-selected", String(active));
        tab.tabIndex = active ? 0 : -1;
      });
      panels.forEach((panel) => panel.classList.toggle("hidden", panel.dataset.tabPanel !== name));
    };

    // Anything else carrying `data-tab` acts as a jump-to control — the Back and
    // Next buttons in the wizard pages are these, not tabs themselves.
    root
      .querySelectorAll('[data-tab]:not([role="tab"])')
      .forEach((control) => control.addEventListener("click", () => select(control.dataset.tab)));

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => select(tab.dataset.tab));
      tab.addEventListener("keydown", (event) => {
        const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
        if (!step) return;
        event.preventDefault();
        const next = tabs[(index + step + tabs.length) % tabs.length];
        next.focus();
        select(next.dataset.tab);
      });
    });

    select((tabs.find((t) => t.getAttribute("aria-selected") === "true") ?? tabs[0]).dataset.tab);
  });
}
