/**
 * Carousel — a horizontal track of slides with prev/next and dot controls.
 *
 *   <div data-carousel data-autoplay="5000">
 *     <div data-carousel-track>
 *       <div data-carousel-slide>…</div>
 *       <div data-carousel-slide>…</div>
 *     </div>
 *     <button data-carousel-prev>…</button>
 *     <button data-carousel-next>…</button>
 *     <div data-carousel-dots></div>
 *   </div>
 *
 * Every slide stays in the DOM and the track is translated, so slide changes cost
 * a transform rather than a fetch and all of the content is present for search and
 * for readers with JS disabled. Autoplay pauses on hover and on focus within, and
 * never starts when the visitor prefers reduced motion.
 */
export function initCarousels() {
  document.querySelectorAll("[data-carousel]").forEach((root) => {
    const track = root.querySelector("[data-carousel-track]");
    const slides = [...root.querySelectorAll("[data-carousel-slide]")];
    if (!track || slides.length < 2) return;

    const dots = root.querySelector("[data-carousel-dots]");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const interval = Number(root.dataset.autoplay) || 0;
    let index = 0;
    let timer = null;

    const buttons = [];
    if (dots) {
      slides.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
        dot.className =
          "h-2 rounded-full transition-all aria-[current=true]:w-6 aria-[current=true]:bg-primary w-2 bg-border hover:bg-muted-foreground";
        dot.addEventListener("click", () => go(i));
        dots.append(dot);
        buttons.push(dot);
      });
    }

    function go(next) {
      index = (next + slides.length) % slides.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      slides.forEach((slide, i) => {
        // Off-screen slides stay in the DOM but out of the tab order.
        slide.setAttribute("aria-hidden", String(i !== index));
        slide.inert = i !== index;
      });
      buttons.forEach((dot, i) => dot.setAttribute("aria-current", String(i === index)));
    }

    root.querySelector("[data-carousel-prev]")?.addEventListener("click", () => go(index - 1));
    root.querySelector("[data-carousel-next]")?.addEventListener("click", () => go(index + 1));

    root.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") go(index - 1);
      if (event.key === "ArrowRight") go(index + 1);
    });

    const start = () => {
      if (!interval || reduceMotion) return;
      stop();
      timer = setInterval(() => go(index + 1), interval);
    };
    const stop = () => timer && clearInterval(timer);

    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);
    root.addEventListener("focusin", stop);
    root.addEventListener("focusout", start);

    go(0);
    start();
  });
}
