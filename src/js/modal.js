/**
 * Modals / drawers.
 *
 *   <button data-modal-open="add-product">Add product</button>
 *   <div id="add-product" data-modal hidden>
 *     <div data-modal-panel>… <button data-modal-close>×</button> …</div>
 *   </div>
 *
 * Clicking the backdrop or pressing Escape closes; focus is trapped in the panel and
 * restored to the trigger on close, and background scroll is locked while open.
 */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

let lastTrigger = null;

export function openModal(modal) {
  if (!modal) return;
  lastTrigger = document.activeElement;
  modal.hidden = false;
  document.body.classList.add("overflow-hidden");
  modal.querySelector(FOCUSABLE)?.focus();
}

export function closeModal(modal) {
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  document.body.classList.remove("overflow-hidden");
  lastTrigger?.focus();
}

export function initModals() {
  document.querySelectorAll("[data-modal-open]").forEach((trigger) => {
    trigger.addEventListener("click", () =>
      openModal(document.getElementById(trigger.dataset.modalOpen)),
    );
  });

  document.querySelectorAll("[data-modal]").forEach((modal) => {
    modal.addEventListener("click", (event) => {
      // Backdrop click: only when the press started outside the panel.
      if (!event.target.closest("[data-modal-panel]")) closeModal(modal);
      if (event.target.closest("[data-modal-close]")) closeModal(modal);
    });

    modal.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeModal(modal);
        return;
      }
      if (event.key !== "Tab") return;

      const items = [...modal.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  });
}
