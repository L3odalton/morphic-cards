// CORE FEATURE 3: Android-style icon container shape-morph.
// OFF/inactive => perfect CIRCLE. ON/active => SQUIRCLE (superellipse).
// Real superellipse via `corner-shape` where supported; animated border-radius
// fallback everywhere else. The morph is THE signature interaction.

import { css } from "lit";

export type IconShape = "circle" | "squircle";

export const iconMorphStyles = css`
  .morph {
    --_size: var(--morphic-icon-container-size, 48px);
    inline-size: var(--_size);
    block-size: var(--_size);
    min-inline-size: 48px;
    min-block-size: 48px;
    display: inline-grid;
    place-items: center;
    box-sizing: border-box;
    cursor: pointer;
    border: none;
    padding: 0;
    /* OFF state: neutral M3 surface, perfect circle. */
    background: var(--md-sys-color-surface-container-high, var(--morphic-surface));
    color: var(--morphic-on-surface);
    border-radius: 50%;
    transition:
      border-radius var(--morphic-shape-duration) var(--morphic-shape-easing),
      background-color 240ms ease,
      color 240ms ease,
      transform 180ms var(--morphic-shape-easing);
    will-change: border-radius, transform;
  }

  .morph:active {
    transform: scale(0.94);
  }

  .morph:focus-visible {
    outline: 2px solid var(--morphic-accent);
    outline-offset: 2px;
  }

  /* ON state: per-card accent fill, squircle. */
  .morph.is-active {
    background: var(--morphic-accent);
    color: var(--morphic-on-accent);
    border-radius: 28%;
  }

  .morph ha-icon,
  .morph .icon {
    --mdc-icon-size: var(--morphic-icon-size);
    inline-size: var(--morphic-icon-size);
    block-size: var(--morphic-icon-size);
  }

  /* Progressive enhancement: true superellipse on supporting engines. */
  @supports (corner-shape: superellipse) {
    .morph {
      corner-shape: superellipse;
    }
    .morph.is-active {
      border-radius: 42%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .morph {
      transition: background-color 120ms ease, color 120ms ease;
    }
  }
`;

/** Map an on/off active flag to the shape name used by the morph container. */
export function shapeForActive(active: boolean): IconShape {
  return active ? "squircle" : "circle";
}
