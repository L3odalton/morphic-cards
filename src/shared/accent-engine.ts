// CORE FEATURE 1 + 2: theme-derived per-card accent engine.
//
// The base palette (--md-sys-color-*) is USER-DEFINED by material-you-theme; we
// never hardcode it. We GENERATE a set of accent seeds (evenly-spaced HCT hues),
// harmonize each toward the user's source for cohesion, then deterministically
// pick one per card. From the chosen seed we derive accent / accent-container /
// on-accent(-container) tokens, tone-correct for the current light/dark mode.

import { hashIndex } from "./hash";
import {
  type Argb,
  harmonize,
  hctArgb,
  hexFromArgb,
  hueOf,
  parseColorToArgb,
  withTone,
  withToneChroma,
} from "./mcu";

export interface PaletteOptions {
  /** Number of evenly-spaced seeds to generate (8–12 recommended). */
  count?: number;
  /** Seed chroma before harmonization. */
  chroma?: number;
  /** Seed tone used purely as the harmonization basis. */
  tone?: number;
  /** Harmonize each seed toward the source (default true). */
  harmonize?: boolean;
  /** Explicit seeds (hex/rgb strings) forcing a fixed palette for power users. */
  explicit?: string[];
}

export interface AccentTokens {
  accent: string;
  onAccent: string;
  accentContainer: string;
  onAccentContainer: string;
}

const DEFAULTS = { count: 10, chroma: 48, tone: 45, harmonize: true } as const;

/**
 * Generate a harmonized accent palette from the user's source color.
 * Returns ARGB seeds. Auto-adapts whenever the user changes their theme,
 * because `source` is read from the live theme upstream.
 */
export function generateHarmonizedPalette(source: Argb, options: PaletteOptions = {}): Argb[] {
  const opts = { ...DEFAULTS, ...options };

  if (opts.explicit && opts.explicit.length) {
    const seeds = opts.explicit
      .map((c) => parseColorToArgb(c))
      .filter((v): v is Argb => v !== null);
    if (seeds.length) {
      return opts.harmonize ? seeds.map((s) => harmonize(s, source)) : seeds;
    }
  }

  const count = Math.max(3, Math.min(16, Math.round(opts.count)));
  const start = hueOf(source); // rotate the wheel relative to the user's hue
  const seeds: Argb[] = [];
  for (let i = 0; i < count; i++) {
    const hue = start + (360 / count) * i;
    const seed = hctArgb(hue, opts.chroma, opts.tone);
    seeds.push(opts.harmonize ? harmonize(seed, source) : seed);
  }
  return seeds;
}

/**
 * Resolve which seed a card should use.
 * Precedence is enforced by the caller; this handles the resolved inputs:
 *  - explicitColor: a hex/rgb string, or a palette index, or a 1-based name like "accent-3"
 *  - otherwise: hash the colorKey into the palette.
 */
export function selectSeed(
  palette: Argb[],
  colorKey: string,
  explicitColor?: string | number,
): Argb {
  if (palette.length === 0) return hctArgb(280, 48, 45);

  if (explicitColor !== undefined && explicitColor !== null && explicitColor !== "") {
    // Numeric index into the palette.
    if (typeof explicitColor === "number" && Number.isFinite(explicitColor)) {
      return palette[((explicitColor % palette.length) + palette.length) % palette.length];
    }
    const str = String(explicitColor).trim();
    // Named index e.g. "accent-3" or plain "3".
    const named = str.match(/(\d+)\s*$/);
    if (/^(accent-)?\d+$/.test(str) && named) {
      const idx = parseInt(named[1], 10) - 1;
      return palette[((idx % palette.length) + palette.length) % palette.length];
    }
    // Explicit color literal.
    const parsed = parseColorToArgb(str);
    if (parsed !== null) return parsed;
  }

  return palette[hashIndex(colorKey, palette.length)];
}

/**
 * Derive the per-card accent token set from a seed, tone-corrected for mode.
 * Mirrors M3 role tone mapping (light vs dark).
 */
export function deriveAccentTokens(seed: Argb, isDark: boolean): AccentTokens {
  if (isDark) {
    return {
      accent: hexFromArgb(withTone(seed, 80)),
      onAccent: hexFromArgb(withTone(seed, 20)),
      accentContainer: hexFromArgb(withToneChroma(seed, 30, 40)),
      onAccentContainer: hexFromArgb(withTone(seed, 90)),
    };
  }
  return {
    accent: hexFromArgb(withTone(seed, 40)),
    onAccent: hexFromArgb(withTone(seed, 100)),
    accentContainer: hexFromArgb(withToneChroma(seed, 92, 30)),
    onAccentContainer: hexFromArgb(withTone(seed, 10)),
  };
}
