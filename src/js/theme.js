/**
 * Light / dark / system theme, persisted in localStorage under
 * `${site.storagePrefix}-theme`.
 *
 * The class is applied by the inline script in <head> before first paint — this module
 * only handles toggling afterwards and following the OS when the mode is "system".
 * That inline script is emitted as a string in build/layout.js (it can't import this
 * module — it must run before any module loads), so it derives the same key from
 * site.storagePrefix at build time. Keep both in sync with site.config.js.
 */
import { site } from "../site.config.js";

const KEY = `${site.storagePrefix}-theme`;

export function getTheme() {
  return localStorage.getItem(KEY) || "system";
}

export function setTheme(theme) {
  localStorage.setItem(KEY, theme);
  applyTheme();
}

export function applyTheme() {
  const theme = getTheme();
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  document.dispatchEvent(new CustomEvent("asoc:themechange", { detail: { dark } }));
}

export function initTheme() {
  applyTheme();

  document.querySelectorAll("#theme-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const dark = document.documentElement.classList.contains("dark");
      setTheme(dark ? "light" : "dark");
    });
  });

  // Explicit picks (used by the settings pages): data-theme-set="light|dark|system".
  document.querySelectorAll("[data-theme-set]").forEach((btn) => {
    btn.addEventListener("click", () => setTheme(btn.dataset.themeSet));
  });

  // Follow the OS while the preference is "system".
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (getTheme() === "system") applyTheme();
  });
}
