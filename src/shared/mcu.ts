// Thin helpers around @material/material-color-utilities (MCU).
// All color math (HCT, harmonization, tone mapping) goes through here so the
// rest of the codebase never touches raw ARGB ints.

import { Hct, Blend, argbFromHex, hexFromArgb } from "@material/material-color-utilities";

export type Argb = number;

export { Hct, argbFromHex, hexFromArgb };

/** Parse a CSS color string (#rgb, #rrggbb, #rrggbbaa, rgb()/rgba()) to ARGB. */
export function parseColorToArgb(input: string): Argb | null {
  const value = input.trim().toLowerCase();
  if (!value) return null;

  if (value.startsWith("#")) {
    let hex = value.slice(1);
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    }
    if (hex.length === 8) hex = hex.slice(0, 6); // drop alpha; MCU is opaque
    if (hex.length !== 6 || /[^0-9a-f]/.test(hex)) return null;
    return argbFromHex(`#${hex}`);
  }

  const rgb = value.match(/^rgba?\(([^)]+)\)$/);
  if (rgb) {
    const parts = rgb[1].split(/[, /]+/).filter(Boolean).slice(0, 3);
    if (parts.length < 3) return null;
    const [r, g, b] = parts.map((p) =>
      p.endsWith("%") ? Math.round((parseFloat(p) / 100) * 255) : Math.round(parseFloat(p)),
    );
    if ([r, g, b].some((n) => Number.isNaN(n))) return null;
    return (255 << 24) | (clamp8(r) << 16) | (clamp8(g) << 8) | clamp8(b);
  }
  return null;
}

function clamp8(n: number): number {
  return Math.max(0, Math.min(255, n)) & 0xff;
}

/** Harmonize a design color toward a source color for cohesion. */
export function harmonize(designArgb: Argb, sourceArgb: Argb): Argb {
  return Blend.harmonize(designArgb, sourceArgb);
}

/** Build an ARGB int from HCT components. */
export function hctArgb(hue: number, chroma: number, tone: number): Argb {
  return Hct.from(normalizeHue(hue), Math.max(0, chroma), clampTone(tone)).toInt();
}

/** Return a new ARGB that keeps the input's hue/chroma but sets a target tone. */
export function withTone(argb: Argb, tone: number): Argb {
  const hct = Hct.fromInt(argb);
  return Hct.from(hct.hue, hct.chroma, clampTone(tone)).toInt();
}

/** Return a new ARGB at the given tone and a (capped) chroma for container tints. */
export function withToneChroma(argb: Argb, tone: number, maxChroma: number): Argb {
  const hct = Hct.fromInt(argb);
  return Hct.from(hct.hue, Math.min(hct.chroma, maxChroma), clampTone(tone)).toInt();
}

export function hueOf(argb: Argb): number {
  return Hct.fromInt(argb).hue;
}

export function chromaOf(argb: Argb): number {
  return Hct.fromInt(argb).chroma;
}

export function toneOf(argb: Argb): number {
  return Hct.fromInt(argb).tone;
}

export function normalizeHue(hue: number): number {
  return ((hue % 360) + 360) % 360;
}

export function clampTone(tone: number): number {
  return Math.max(0, Math.min(100, tone));
}
