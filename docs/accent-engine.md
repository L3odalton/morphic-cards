# Morphic Accent Engine (Features 1 & 2)

Morphic ships a **generator**, not fixed hex values. The base palette
(`--md-sys-color-*`) is **user-defined** by material-you-theme; we only assign each card a
**distinct accent that harmonizes** with whatever base the user chose. Change your theme →
accents re-derive automatically.

## Pipeline

1. **Read the source.** At runtime we read `--md-sys-color-primary` from the active theme
   (falling back to `--primary-color` / `--accent-color` off-theme, then an M3 baseline).
   See `src/shared/theme.ts`.
2. **Generate seeds.** We create ~8–12 accent seeds as **evenly-spaced HCT hues** around
   the wheel for variety (`src/shared/accent-engine.ts → generateHarmonizedPalette`).
3. **Harmonize.** Each seed is pulled toward the user's source with Material Color
   Utilities `Blend.harmonize()` for cohesion.
4. **Select deterministically.** A stable hash (`cyrb53`, `src/shared/hash.ts`) of the
   card's *color key* indexes into the palette. **Same key → same accent** on every reload
   and device.
5. **Derive tokens.** From the chosen seed we derive `--morphic-accent`,
   `--morphic-accent-container`, `--morphic-on-accent(-container)` via HCT tone mapping,
   tone-corrected for the current **light/dark** mode.

## `color_key` precedence

When choosing which accent a card gets, Morphic resolves in this order:

1. **`color:`** — explicit override. Accepts a hex (`#3b82f6`), `rgb()/rgba()`, a palette
   **index** (`3`), or a palette **name** (`accent-3`). Bypasses hashing.
2. **`color_key:`** — an explicit stable key to hash.
3. **card title / `name`** — the default.
4. **`entity_id`** — last resort.

## Power-user overrides

```yaml
type: custom:morphic-trv-card
entity: climate.office
# Force seeds (still harmonized to your theme unless harmonize: false)
palette:
  - "#3b82f6"
  - "#ef4444"
  - "#22c55e"
harmonize: true        # default true; set false to use seeds verbatim
palette_size: 10       # number of generated seeds when palette is not set
color_key: office-trv  # deterministic selection key
# color: "#7c3aed"     # or force one accent outright
accent_intensity: 0.14 # gradient strength (Feature 2)
flat_fill: false       # true => single tint instead of gradient
```

## Why HCT + harmonize?

- **HCT** (hue, chroma, tone) lets us hold a hue while moving tone precisely for correct
  contrast in light vs dark — far better than naive HSL.
- **`Blend.harmonize`** nudges each generated hue toward the user's source so a dozen
  distinct card accents still read as one coherent family.
