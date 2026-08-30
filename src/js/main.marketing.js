/**
 * Entry point for a marketing-only edition (a landing/shop template with no
 * admin surface) — committed alongside `main.js` so porting one of the ~105
 * marketing products is switching one line in each page's
 * `<script type="module" src="...">` rather than hand-editing `main.js`'s
 * import list and risking a stale reference to a module the port deletes.
 *
 * A marketing port should still delete the unused app-only modules (sidebar,
 * command-palette, table, filter, sortable, rating, player, overlay, editor,
 * charts, maps, panes) and `main.js` itself — this file never imports them,
 * so nothing here goes stale when that happens. Trim the font imports below
 * to whatever the edition actually uses.
 */
import "@fontsource-variable/manrope";
import "@fontsource-variable/sora";
import "../css/globals.css";

import { bootCore } from "./main.core.js";

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootCore, { once: true });
} else {
  bootCore();
}
