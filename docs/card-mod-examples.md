# Card-Mod Examples

Morphic is built to be tuned with [Card-Mod](https://github.com/thomasloven/lovelace-card-mod).
**Override `--morphic-*` tokens — never internal selectors.** Tokens are the public API;
internal markup may change between releases.

## Nudge the accent gradient

```yaml
type: custom:morphic-trv-card
entity: climate.bedroom
card_mod:
  style: |
    :host {
      --morphic-accent-fill-intensity: 0.22;   /* a touch stronger */
      --morphic-accent-gradient-angle: 135deg;  /* diagonal */
    }
```

## Flatten the fill to a single tint

```yaml
type: custom:morphic-trv-card
entity: climate.bedroom
card_mod:
  style: |
    :host {
      --morphic-accent-fill: color-mix(
        in srgb, var(--morphic-accent) 16%, transparent
      );
    }
```

(Or simply set `flat_fill: true` in the card config.)

## Snappier / calmer shape-morph

```yaml
card_mod:
  style: |
    :host {
      --morphic-shape-duration: 260ms;
      --morphic-shape-easing: cubic-bezier(0.2, 0.8, 0.2, 1);
      --morphic-icon-container-size: 56px;
    }
```

## Rounder card + tighter spacing

```yaml
card_mod:
  style: |
    :host {
      --morphic-radius: 28px;
      --morphic-gap: 8px;
    }
```

## Pin a custom accent via tokens (config is preferred)

```yaml
card_mod:
  style: |
    :host {
      --morphic-accent: #7c3aed;
      --morphic-on-accent: #ffffff;
      --morphic-accent-container: #ede9fe;
      --morphic-on-accent-container: #2e1065;
    }
```

> Prefer `color:` / `color_key:` in the card config for accents — it keeps selection
> deterministic and theme-harmonized. Use token pinning only when you want a fixed,
> theme-independent color.

## Don't do this

```yaml
# ❌ Targets internal structure — will break across releases.
card_mod:
  style: |
    .morphic-root .segmented .seg.is-active { background: red; }
```
