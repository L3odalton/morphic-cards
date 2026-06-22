// The Morphic TOKEN CONTRACT — the public styling surface.
//
// Card-Mod users override these `--morphic-*` tokens, NEVER internal selectors.
// Everything here is documented in docs/token-contract.md. Treat additions as
// public API. Defaults reference --md-sys-color-* (material-you-theme) and fall
// back to native HA CSS vars so cards still look right off-theme.

import { css } from "lit";
import type { AccentTokens } from "./accent-engine";

/** Public token names (string constants to avoid typos across the codebase). */
export const TOKENS = {
  accent: "--morphic-accent",
  onAccent: "--morphic-on-accent",
  accentContainer: "--morphic-accent-container",
  onAccentContainer: "--morphic-on-accent-container",
  accentFill: "--morphic-accent-fill",
  accentFillIntensity: "--morphic-accent-fill-intensity",
  accentGradientAngle: "--morphic-accent-gradient-angle",
  surface: "--morphic-surface",
  onSurface: "--morphic-on-surface",
  onSurfaceVariant: "--morphic-on-surface-variant",
  outline: "--morphic-outline",
  radius: "--morphic-radius",
  gap: "--morphic-gap",
  iconSize: "--morphic-icon-size",
  shapeDuration: "--morphic-shape-duration",
  shapeEasing: "--morphic-shape-easing",
} as const;

/**
 * Base token defaults applied at :host of every Morphic element. Uses
 * `--md-sys-color-*` first, then native HA vars as graceful fallbacks.
 */
export const morphicBaseTokens = css`
  :host {
    /* --- Surface roles (fallback chain: M3 -> native HA -> sane default) --- */
    --morphic-surface: var(
      --md-sys-color-surface-container,
      var(--ha-card-background, var(--card-background-color, #fff))
    );
    --morphic-on-surface: var(--md-sys-color-on-surface, var(--primary-text-color, #1c1b1f));
    --morphic-on-surface-variant: var(
      --md-sys-color-on-surface-variant,
      var(--secondary-text-color, #49454f)
    );
    --morphic-outline: var(--md-sys-color-outline-variant, var(--divider-color, #c4c7c5));

    /* --- Accent roles: derived per-card at runtime by the accent engine. --- */
    /* These defaults only show if the engine hasn't run yet. */
    --morphic-accent: var(--md-sys-color-primary, var(--primary-color, #6750a4));
    --morphic-on-accent: var(--md-sys-color-on-primary, #ffffff);
    --morphic-accent-container: var(--md-sys-color-primary-container, #eaddff);
    --morphic-on-accent-container: var(--md-sys-color-on-primary-container, #21005d);

    /* --- Gradient fill (Feature 2): subtle accent -> primary --- */
    --morphic-accent-fill-intensity: 0.14;
    --morphic-accent-gradient-angle: 90deg;
    --morphic-accent-fill: linear-gradient(
      var(--morphic-accent-gradient-angle),
      color-mix(
          in srgb,
          var(--morphic-accent) calc(var(--morphic-accent-fill-intensity) * 100%),
          transparent
        )
        0%,
      color-mix(
          in srgb,
          var(--md-sys-color-primary, var(--primary-color, var(--morphic-accent)))
            calc(var(--morphic-accent-fill-intensity) * 70%),
          transparent
        )
        100%
    );

    /* --- Shape + spacing --- */
    --morphic-radius: 16px;
    --morphic-gap: 12px;
    --morphic-icon-size: 22px;

    /* --- Icon-morph motion (Feature 3): spring-ish easing --- */
    --morphic-shape-duration: 420ms;
    --morphic-shape-easing: cubic-bezier(0.2, 0.9, 0.1, 1.08);

    font-family: var(
      --md-sys-typescale-body-large-font,
      var(--mdc-typography-font-family, var(--paper-font-body1_-_font-family, "Roboto", sans-serif))
    );
    color: var(--morphic-on-surface);
  }
`;

/** Apply the runtime-derived accent token values onto an element's inline style. */
export function applyAccentTokens(host: HTMLElement, t: AccentTokens): void {
  host.style.setProperty(TOKENS.accent, t.accent);
  host.style.setProperty(TOKENS.onAccent, t.onAccent);
  host.style.setProperty(TOKENS.accentContainer, t.accentContainer);
  host.style.setProperty(TOKENS.onAccentContainer, t.onAccentContainer);
}

/** Flatten the gradient to a single tint (Feature 2 option). */
export function setFlatFill(host: HTMLElement, flat: boolean): void {
  if (flat) {
    host.style.setProperty(
      TOKENS.accentFill,
      "color-mix(in srgb, var(--morphic-accent) calc(var(--morphic-accent-fill-intensity) * 100%), transparent)",
    );
  } else {
    host.style.removeProperty(TOKENS.accentFill);
  }
}
