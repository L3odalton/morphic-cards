# Morphic — Claude Code Guidelines

## Project overview

Morphic is a Home Assistant **custom-card collection** implementing **Material 3 Expressive**, designed to be extended with [Card-Mod](https://github.com/thomasloven/lovelace-card-mod). It is **cards only** — no theme. It rides on [Nerwyn/material-you-theme](https://github.com/Nerwyn/material-you-theme) + [material-you-utilities](https://github.com/Nerwyn/material-you-utilities) as the base color/token engine.

> Cards: **TRV Card** (thermostatic radiator valves), **Person Card** (person.* with status indicator bubbles).

## Commands

```bash
npm install          # install pinned toolchain (Node 24 LTS required)
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run lint:fix     # eslint --fix
npm run build        # production bundle → dist/morphic.js
npm run dev          # rollup watch + auto-SFTP to HA
npm run deploy       # build + SFTP to HA
npm run deploy:dry   # validate config without connecting
```

Always run `npm run typecheck` and `npm run lint` before considering work done.

## Architecture

```
src/shared/    base-card, accent engine, tokens, actions, localize, MCU/hash helpers
src/editors/   ha-form editor base + per-card editors (Card-Mod section built in)
src/cards/     first-party cards (TRV, Person)
src/morphic.ts entry point (registers all cards)
scripts/       SSH/SFTP deploy + watch tooling
docs/          token contract, accent engine docs, Card-Mod examples
```

Entry point: `src/morphic.ts` → Rollup → `dist/morphic.js` (single ES module bundle).

## Hard rules

- **Sections-first layout**: every card implements `getGridOptions()`, fully responsive via container queries — no fixed pixel widths.
- **Token-only styling**: use `--morphic-*` and `--md-sys-color-*` tokens. Never hardcode hex colors. Fall back to native HA CSS vars (`--primary-color`, `--card-background-color`) when off-theme.
- **Card-Mod contract**: public `--morphic-*` tokens are the API surface. Never rename/remove without updating `docs/token-contract.md`.
- **Mobile-first**: one-handed reach, min 48dp touch targets, bottom nav, pop-ups over page jumps.
- **No theme**: never override `--md-sys-color-*`. The palette is user-defined by the theme at runtime.
- **No HACS yet**: do not add `hacs.json`, `info.md`, or HACS validation to CI.
- **Never commit secrets**: `.env.deploy` is gitignored. Auth is SSH-agent only.
- **Cross-platform deploy**: never use rsync. The SFTP tooling works on Windows/PowerShell.

## Authoring cards

- Extend `MorphicCard` from `src/shared/base-card.ts` — never subclass `LitElement` directly.
- Implement `getGridOptions()` with sensible defaults + `min_columns` / `min_rows`.
- Provide `static getConfigElement()`, `static getStubConfig()`, register via `registerMorphicCard()`.
- Use inherited features: `this.accent` / `this.colorKey` for accents, `var(--morphic-accent-fill)` for gradient, `iconShape` for circle↔squircle morph.
- Use `bindActionHandler()` from `src/shared/actions.ts` for tap/hold on the card's main interactive element. Bind in `firstUpdated()`, clean up in `disconnectedCallback()`. Hold fires on **release** after 500ms threshold (HA pattern). Chips use simple `@click` handlers — hold/double-tap not implemented on chips.
- Use `localize()` from `src/shared/localize.ts` for all user-facing strings (EN + DE supported).
- Register the card in `src/morphic.ts` (import + `registerCustomCard()`).
- **HA 2026.6 entity picker**: add `getEntitySuggestion` to the `registerCustomCard()` call so the card appears in HA's "By entity" card picker. Return `null` for unsupported entities, or a `{ config }` object with the entity pre-populated. Only cards with a primary entity need this (not separators, room cards, etc.).
- **Naming convention**: card names use `"Morphic - Card Name"` format (with dash separator).

### Sections-first dynamic height (critical)

Cards **must** support any height the user sets in the Sections grid editor. The base card provides:

- `:host { block-size: 100% }` — fills the grid cell.
- `.morphic-root { block-size: 100% }` — fills the host.
- `data-size` attribute on `:host` with width buckets: `compact` (<220px), `regular` (<360px), `wide` (360px+).
- `data-height` attribute on `:host` with height buckets: `compact` (<80px), `medium` (<140px), `tall` (<220px), `x-tall` (220px+).

Use `:host([data-height="medium"])` selectors in your card's CSS to scale layout at different heights. Use `@container morphic` queries for width. **Never use `container-type: size`** — it prevents content-based sizing on the block axis and collapses the card to zero height.

## Authoring editors

- Extend the editor base from `src/editors/base-editor.ts`.
- Render with `ha-form` + selectors (`ha-entity-picker`, `ha-selector`, etc.) — no raw YAML.
- Fire `config-changed` via `dispatchConfig()` — never mutate config in place.
- Mobile-first, M3-token styled, grouped/collapsible sections, helper text, live preview.
- **Expandable sections must use `name: ""`** — a non-empty name causes `ha-form` to nest child values under that key, breaking the flat config the card expects. Use `title:` for the section header, not `name:`.
- The base editor automatically appends a **Card-Mod CSS section** at the bottom — no per-card work needed.
- For nested config (like `bubbles[]` or `card_mod.style`), flatten to editor-friendly fields (e.g. `bubble_1_states`) and convert back in `withDefaults()` / `setConfig()`.

## Core features (inherited from base — don't reimplement per card)

1. Per-card **accent engine** — HCT seeds + `Blend.harmonize()`, deterministic hash, precedence: `color:` > `color_key:` > title > `entity_id`.
2. Subtle **accent → primary gradient** fill (token-controlled intensity/angle, mode-aware: 14% dark / 4% light).
3. **Circle ↔ squircle icon-morph** for OFF/ON states.
4. **Sections-first** responsive layout via `getGridOptions()` + width/height ResizeObserver buckets.
5. Polished **ha-form GUI editor** with live preview + built-in Card-Mod section.
6. **Tap/hold actions** via `src/shared/actions.ts` (fires HA-native `hass-action` events). Hold fires on release after 500ms threshold.
7. **i18n** via `src/shared/localize.ts` (EN + DE; add languages by extending the `strings` map).
8. **SSH/SFTP** dev/deploy tooling.

## External dependencies (reuse, don't reimplement)

- **Bubble Card** for pop-ups.
- **navbar-card** for bottom navigation.

## Deploy

Secrets in gitignored `.env.deploy` (template: `.env.deploy.example`). SSH host/port/user + remote path. Auth via SSH agent only.
