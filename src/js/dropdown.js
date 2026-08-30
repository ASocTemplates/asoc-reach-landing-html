/**
 * Dropdown menus / popovers.
 *
 *   <div data-dropdown>
 *     <button data-dropdown-trigger aria-expanded="false">…</button>
 *     <div data-dropdown-menu hidden>…</div>
 *   </div>
 *
 * Opening one closes the others; Escape closes and returns focus to the trigger.
 */
export function initDropdowns() {
  const dropdowns = [...document.querySelectorAll("[data-dropdown]")];

  const close = (root) => {
    const menu = root.querySelector("[data-dropdown-menu]");
    const trigger = root.querySelector("[data-dropdown-trigger]");
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    trigger?.setAttribute("aria-expanded", "false");
  };

  const closeAll = (except) => dropdowns.forEach((d) => d !== except && close(d));

  dropdowns.forEach((root) => {
    const trigger = root.querySelector("[data-dropdown-trigger]");
    const menu = root.querySelector("[data-dropdown-menu]");
    if (!trigger || !menu) return;

    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      const willOpen = menu.hidden;
      closeAll(root);
      menu.hidden = !willOpen;
      trigger.setAttribute("aria-expanded", String(willOpen));
    });

    menu.addEventListener("click", (event) => {
      // Let links navigate, but keep clicks inside the menu from closing it early.
      if (!event.target.closest("a, [data-dropdown-close]")) {
        event.stopPropagation();
      }
    });

    root.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      close(root);
      trigger.focus();
    });
  });

  document.addEventListener("click", () => closeAll());
}
