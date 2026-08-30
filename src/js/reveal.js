/**
 * Scroll-reveal for `[data-reveal]` elements.
 *
 * The React/Next editions animate sections in with a `Reveal` component whose
 * pre-animation state is `opacity-0`. A static page has no such component, so
 * without this module those sections would ship invisible. Elements are revealed
 * by adding `data-revealed`; the CSS keys off that attribute.
 *
 * Reveals immediately — no animation — when the visitor prefers reduced motion
 * or the browser has no IntersectionObserver, so content is never hidden by a
 * capability check.
 */
export function initReveal() {
  const targets = document.querySelectorAll("[data-reveal]:not([data-revealed])");
  if (!targets.length) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.setAttribute("data-revealed", ""));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.setAttribute("data-revealed", "");
        io.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
  );

  targets.forEach((el) => io.observe(el));
}
