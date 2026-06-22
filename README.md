# Morphic

**Morphic** is a Home Assistant first-party **custom-card collection** implementing
**Material 3 Expressive**, engineered to be edited and extended with
[Card-Mod](https://github.com/thomasloven/lovelace-card-mod). The name reflects M3
Expressive's signature shape-morphing — a literal core design goal.

Morphic is **cards only**. It does **not** ship a theme. It rides on top of
[**Nerwyn/material-you-theme**](https://github.com/Nerwyn/material-you-theme) and its
companion [**material-you-utilities**](https://github.com/Nerwyn/material-you-utilities)
as the base color/token engine (`--md-sys-color-*`, surfaces, light/dark via Material
Color Utilities, the Expressive scheme).

> First card: the **Morphic TRV Card** for thermostatic radiator valves.

## Core features (baked into the shared base — every card inherits them)

1. **Per-card accent engine** — derived from *your* theme. Generates harmonized HCT seeds
   and deterministically assigns each card a distinct accent. ([docs](docs/accent-engine.md))
2. **Subtle accent → primary gradient** fill, low-intensity so text stays legible.
3. **Android-style icon-morph** — OFF = circle, ON = squircle (superellipse), animated
   with spring-ish easing.
4. **Sections-first layout** — every card implements `getGridOptions()` and is fully
   responsive via container queries (no fixed pixel widths).
5. **First-class GUI editor** — polished `ha-form` editor with grouped sections, helper
   text, and HA's live preview. Never a raw YAML blob.
6. **SSH/SFTP dev & deploy** — push the built bundle to a running HA instance, cross-platform.

## Install order (important)

Morphic depends on the theme being present first.

1. Install **material-you-theme** and **material-you-utilities** (HACS or manual) and
   select the theme. This provides the `--md-sys-color-*` tokens Morphic reads.
2. Build Morphic (`npm run build`) and copy `dist/morphic.js` to your HA `www` folder, or
   use `npm run deploy` (below).
3. Add the resource (Settings → Dashboards → ⋮ → Resources):
   - URL: `/local/morphic/morphic.js`
   - Type: **JavaScript Module**
4. Add a card → search **"Morphic TRV Card"**.

> HACS packaging is **not** included yet (see Roadmap).

## Development

Requires **Node.js 24 LTS**.

```bash
npm install        # install pinned toolchain
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run build      # production bundle -> dist/morphic.js
```

### Live dev/deploy over SSH

1. Copy the template and fill it in (it is **gitignored** — never commit secrets):

   ```bash
   cp .env.deploy.example .env.deploy
   ```

   | Key | Meaning |
   |---|---|
   | `MORPHIC_SSH_HOST` | SSH hostname |
   | `MORPHIC_SSH_PORT` | SSH port (default 22) |
   | `MORPHIC_SSH_USER` | SSH user |
   | `MORPHIC_REMOTE_PATH` | e.g. `/config/www/morphic` |

   Auth uses your **SSH agent** only — the same mechanism as `ssh user@host`. No key
   files or passwords in `.env.deploy`. If SSH doesn't work from your shell, deploy won't
   either.

2. Commands:

   ```bash
   npm run deploy      # build, then SFTP dist/ -> remote
   npm run deploy:dry  # validate config + bundle without connecting
   npm run dev         # rollup watch; auto-SFTP the bundle on every rebuild
   ```

   `npm run dev` logs a clear success line per push, e.g.
   `[morphic] ✓ pushed dist → root@ha.local:/config/www/morphic (morphic.js 104.7 kB, 312 ms)`.
   Cross-platform (Windows/PowerShell friendly) — **no rsync**.

## Configuration — Morphic TRV Card

```yaml
type: custom:morphic-trv-card
entity: climate.living_room        # required, climate.*
name: Living Room                  # optional; also the default color key
step: 0.5                          # optional; defaults to target_temp_step
show_hvac_modes: true
show_presets: true
show_valve_position: false
show_battery: false
show_window: false
# valve_position_entity: sensor.trv_valve
# battery_entity: sensor.trv_battery
# window_entity: binary_sensor.window
# --- accent (see docs/accent-engine.md) ---
# color: "#7c3aed"   # or palette index/name
# color_key: lr-trv
# harmonize: true
# flat_fill: false
# accent_intensity: 0.14
```

Everything above is editable in the **GUI editor** with helper text and live preview.

## Token contract (Card-Mod)

Style with **tokens only** — never internal selectors. Full list in
[`docs/token-contract.md`](docs/token-contract.md); recipes in
[`docs/card-mod-examples.md`](docs/card-mod-examples.md).

## Architecture

```
src/shared/   token contract, MorphicCard base (Features 1–4), accent generator, MCU + hash helpers, HA-var fallbacks
src/editors/  M3-styled ha-form editor base (Feature 5) + per-card editors
src/cards/    first-party cards (TRV card)
scripts/      SSH/SFTP deploy + watch (Feature 6)
docs/         token contract, accent engine, Card-Mod examples
```

Project conventions are documented in [`CLAUDE.md`](CLAUDE.md) for Claude Code and in
[`.claude/settings.json`](.claude/settings.json) for permissions.

## External dependencies (reused, not reimplemented)

- **Bubble Card** for pop-ups (material-you-theme already ships Bubble Card tokens).
- **navbar-card** for bottom navigation.

## Principles

Mobile-first, form-follows-function: one-handed reach, min 48dp targets, bottom nav,
pop-ups over page jumps. Sections-first layout is a hard requirement. Token-driven styling
only. Design against the **Expressive** scheme; per-card accents come from the engine.

## Roadmap

- **HACS packaging** (`hacs.json` / `info.md`, HACS validation in CI).
- More first-party cards, including a **light / dimmer card** (intentionally *not* the
  first card).
- Broader **Expressive motion** across components.

## License

[MIT](LICENSE)
