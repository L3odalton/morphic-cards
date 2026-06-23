# Recommended Dashboard Background

Morphic cards use M3 **elevated card** styling — no border, subtle shadow, `surface-container` background with an accent gradient overlay. They look best on a surface that sits one tone step below the cards, creating natural M3 layering.

## Recommended setup (Sections view)

A top-to-bottom gradient using neutral surface tones — slightly lighter at the top, darker at the bottom. No color, just depth:

```yaml
views:
  - type: sections
    max_columns: 4
    background: var(--md-sys-color-surface, var(--primary-background-color))
```

## Minimal alternative

If you prefer zero gradient, a flat M3 base surface still provides clean card separation:

```yaml
views:
  - type: sections
    max_columns: 4
    background: var(--md-sys-color-surface, var(--primary-background-color))
```

## M3 surface layering reference

| Token | Typical tone (dark) | Used by |
|---|---|---|
| `surface` | 6 | Dashboard background (bottom) |
| `surface-container-low` | 10 | Dashboard background (top) |
| `surface-container` | 12 | **Morphic card background** |
| `surface-container-high` | 17 | Segmented controls, extras |

The elevation shadow on Morphic cards reinforces this layering — cards appear to float slightly above the dashboard surface.
