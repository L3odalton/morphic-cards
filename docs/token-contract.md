# Morphic Token Contract

These `--morphic-*` CSS custom properties are the **public styling surface** of every
Morphic card. They are the API you override with **Card-Mod**.

> **Rule:** override **tokens only** — never internal selectors, shadow-DOM classes, or
> element structure. Internal markup may change between releases; tokens will not (without
> a documented change).

Morphic reads the user's theme (`--md-sys-color-*` from
[material-you-theme](https://github.com/Nerwyn/material-you-theme)) at runtime and derives
the accent tokens per card. Off-theme, tokens fall back to native HA variables.

## Surface roles

| Token | Default (fallback chain) | Purpose |
|---|---|---|
| `--morphic-surface` | `--md-sys-color-surface-container` → `--ha-card-background` → `--card-background-color` | Card background |
| `--morphic-on-surface` | `--md-sys-color-on-surface` → `--primary-text-color` | Primary text/icons |
| `--morphic-on-surface-variant` | `--md-sys-color-on-surface-variant` → `--secondary-text-color` | Secondary text |
| `--morphic-outline` | `--md-sys-color-outline-variant` → `--divider-color` | Borders/dividers |

## Accent roles (derived per card at runtime — Feature 1)

| Token | Purpose |
|---|---|
| `--morphic-accent` | The card's distinct, theme-harmonized accent |
| `--morphic-on-accent` | Foreground on a filled accent surface |
| `--morphic-accent-container` | Soft accent tint (containers, chips) |
| `--morphic-on-accent-container` | Foreground on the soft tint |

You normally let the engine derive these. To **force** an accent, prefer the card config
(`color:` / `color_key:`) so selection stays deterministic. You _can_ also pin a token via
Card-Mod (see examples), but config is the supported path.

## Gradient fill (Feature 2)

| Token | Default | Purpose |
|---|---|---|
| `--morphic-accent-fill-intensity` | `0.14` | Strength of the accent → primary blend (keep subtle for legibility) |
| `--morphic-accent-gradient-angle` | `90deg` | Gradient direction (left → right) |
| `--morphic-accent-fill` | `linear-gradient(...)` | The computed fill; override to fully customize or flatten |

Set the card option `flat_fill: true` to collapse the gradient to a single tint.

## Shape + motion (Feature 3)

| Token | Default | Purpose |
|---|---|---|
| `--morphic-radius` | `--ha-card-border-radius` → `20px` | Card corner radius |
| `--morphic-icon-size` | `22px` | Glyph size inside icon containers |
| `--morphic-icon-container-size` | `48px` | Morphing icon container size (min 48dp target) |
| `--morphic-shape-duration` | `420ms` | Circle ↔ squircle morph duration |
| `--morphic-shape-easing` | `cubic-bezier(0.2, 0.9, 0.1, 1.08)` | Spring-ish morph easing |

## Spacing

| Token | Default | Purpose |
|---|---|---|
| `--morphic-gap` | `12px` | Internal stack gap |

See [`card-mod-examples.md`](./card-mod-examples.md) for override recipes and
[`accent-engine.md`](./accent-engine.md) for how accents are generated.
