// Reads the *user-defined* theme at runtime. We never hardcode --md-sys-color-*;
// material-you-theme owns those. We only read the source/primary and the
// light/dark mode, with graceful fallbacks to native HA CSS vars off-theme.

import type { HomeAssistant } from "./ha";
import { parseColorToArgb, argbFromHex, type Argb } from "./mcu";

// Material-3 default source (M3 baseline purple) — last-resort only, used when
// neither the theme nor HA expose a usable primary color.
const FALLBACK_SOURCE_HEX = "#6750a4";

export interface ThemeContext {
  /** Source/seed color (ARGB) read from the active theme or HA fallback. */
  source: Argb;
  /** True when HA is in dark mode (or prefers-color-scheme: dark off-theme). */
  isDark: boolean;
  /** True when material-you-theme tokens are present on the element. */
  hasMaterialYou: boolean;
}

function firstUsableVar(style: CSSStyleDeclaration, names: string[]): string | null {
  for (const name of names) {
    const v = style.getPropertyValue(name).trim();
    if (v) return v;
  }
  return null;
}

/**
 * Resolve the theme context for a given element. Reads computed CSS custom
 * properties so it reflects whatever theme the user has applied.
 */
export function readThemeContext(element: HTMLElement, hass?: HomeAssistant): ThemeContext {
  const style = getComputedStyle(element);

  const mdPrimary = style.getPropertyValue("--md-sys-color-primary").trim();
  const hasMaterialYou = Boolean(mdPrimary);

  const raw =
    firstUsableVar(style, [
      "--md-sys-color-primary",
      "--primary-color", // native HA
      "--accent-color", // native HA
    ]) ?? FALLBACK_SOURCE_HEX;

  const source = parseColorToArgb(raw) ?? argbFromHex(FALLBACK_SOURCE_HEX);

  let isDark: boolean;
  if (hass && typeof hass.themes?.darkMode === "boolean") {
    isDark = hass.themes.darkMode;
  } else if (typeof window !== "undefined" && window.matchMedia) {
    isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  } else {
    isDark = false;
  }

  return { source, isDark, hasMaterialYou };
}
