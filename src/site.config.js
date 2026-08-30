/**
 * Per-edition brand configuration — the ONLY place a template's name, copy or
 * asset paths live. `build/layout.js` reads this at build time.
 *
 * When creating a new edition from the kit, this is the first file to edit.
 */
export const site = {
  /** Product name, e.g. "ASoc Hearth". */
  name: "ASoc Reach",
  /** Appended to every page title after an em dash. */
  titleSuffix: "ASoc Reach",
  /** <meta name="description"> fallback when a page's @meta omits one. */
  description:
    "ASoc Reach — AI-powered marketing that lifts engagement, multiplies conversions and opens new doors to lasting success.",
  /** Full logo rendered by the sidebar, auth layout and horizontal header. Lives in public/. */
  logo: "/asoc-logo.svg",
  /**
   * Light-on-dark variant of `logo`, shown instead of `logo` when `.dark` is
   * active. The stock marketing header/footer (`build/layout.js`) render a
   * single `<img>` on `bg-background`, which flips from white to near-black
   * with the theme — a single-colour logo goes invisible in one of the two
   * states. `themedLogo()` swaps between `logo`/`logoDark` via
   * `dark:hidden`/`hidden dark:block`, same fix as asoc-hearth-landing-html.
   */
  logoDark: "/asoc-logo-dark.svg",
  /** Narrow/collapsed variant of `logo`, shown when the sidebar rail is collapsed. Lives in public/. */
  mark: "/asoc-mark.svg",
  /** Dark-background variant of `mark` — see `logoDark`. */
  markDark: "/asoc-mark-dark.svg",
  /** Where the logo and "back home" links point. */
  homeHref: "/",
  /**
   * localStorage key prefix for persisted UI preferences (theme, sidebar
   * collapse). Derived keys are `${storagePrefix}-theme` and
   * `${storagePrefix}-sidebar`. Give every edition its own prefix when
   * several ASoc templates are served from the same origin (e.g. multiple
   * demos on one staging domain) — without it, opening one template's
   * preview overwrites another's saved theme/sidebar state.
   *
   * Consumed in three places that must all read this same value: the
   * pre-paint script build/layout.js's head() emits (build-time, can't
   * import modules), and the runtime modules src/js/theme.js and
   * src/js/sidebar.js.
   */
  storagePrefix: "asoc",
};
