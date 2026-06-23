# Recommended Dashboard Background

Morphic cards use M3 **elevated card** styling — no border, subtle shadow, `surface-container` background with an accent gradient overlay. They look best on a surface that's slightly darker (dark mode) or lighter (light mode) than the cards themselves, creating natural M3 layering.

## Quick setup (Sections view)

Add this to your view YAML (Edit dashboard → Raw configuration):

```yaml
views:
  - type: sections
    max_columns: 4
    background:
      color: var(--md-sys-color-surface, var(--primary-background-color))
```

This uses the M3 base surface from material-you-theme. The cards sit on `surface-container` (one step up), so they naturally separate from the background.

## Enhanced: subtle vignette

For a more polished look, use a radial gradient that gently brightens the center:

```yaml
views:
  - type: sections
    max_columns: 4
    background:
      image: radial-gradient(ellipse at 50% 0%, var(--md-sys-color-surface-container-low, var(--primary-background-color)) 0%, var(--md-sys-color-surface, var(--primary-background-color)) 70%)
```

## With a wallpaper

If you prefer an image background, pair it with a semi-transparent overlay so card text stays readable:

```yaml
views:
  - type: sections
    max_columns: 4
    background:
      image: /local/your-wallpaper.jpg
```

Then in your theme or Card-Mod, add a scrim:

```yaml
card_mod:
  class: morphic-bg
  style:
    ha-sections-view $: |
      :host::before {
        content: '';
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(20px);
        z-index: -1;
      }
```

## M3 surface layering reference

| Token | Typical tone (dark) | Used by |
|---|---|---|
| `surface` | 6 | **Dashboard background** |
| `surface-container-low` | 10 | Vignette highlight |
| `surface-container` | 12 | **Morphic card background** |
| `surface-container-high` | 17 | Segmented controls, extras |

The elevation shadow on Morphic cards reinforces this layering — cards appear to float slightly above the dashboard surface.
