// FIRST DELIVERABLE: the Morphic TRV Card.
// A mobile-first card for thermostatic radiator valves (climate.* entities:
// Z2M / ZHA / Tado TRVs). Inherits the accent engine, accent->primary gradient,
// circle<->squircle icon-morph, and sections-first responsiveness from MorphicCard.

import { html, css, nothing, type TemplateResult, type CSSResultGroup } from "lit";
import { customElement } from "lit/decorators.js";

import { MorphicCard, type MorphicBaseConfig } from "../shared/base-card";
import { iconMorphStyles, shapeForActive } from "../shared/shapes";
import type { MorphicGridOptions } from "../shared/grid";
import { type HassEntity, type HomeAssistant, isUnavailable } from "../shared/ha";

export interface TrvCardConfig extends MorphicBaseConfig {
  entity: string;
  step?: number;
  show_hvac_modes?: boolean;
  show_presets?: boolean;
  show_valve_position?: boolean;
  show_battery?: boolean;
  show_window?: boolean;
  valve_position_entity?: string;
  battery_entity?: string;
  window_entity?: string;
}

const HVAC_ICONS: Record<string, string> = {
  off: "mdi:power",
  heat: "mdi:fire",
  cool: "mdi:snowflake",
  auto: "mdi:autorenew",
  heat_cool: "mdi:sun-snowflake-variant",
  dry: "mdi:water-percent",
  fan_only: "mdi:fan",
};

const PRESET_ICONS: Record<string, string> = {
  none: "mdi:cancel",
  boost: "mdi:rocket-launch",
  comfort: "mdi:sofa",
  eco: "mdi:leaf",
  away: "mdi:home-export-outline",
  home: "mdi:home",
  sleep: "mdi:power-sleep",
  activity: "mdi:run",
};

@customElement("morphic-trv-card")
export class MorphicTrvCard extends MorphicCard<TrvCardConfig> {
  static getConfigElement(): HTMLElement {
    return document.createElement("morphic-trv-card-editor");
  }

  static getStubConfig(hass: HomeAssistant): TrvCardConfig {
    const climate = Object.keys(hass?.states ?? {}).find((id) => id.startsWith("climate."));
    return { type: "custom:morphic-trv-card", entity: climate ?? "climate.living_room" };
  }

  protected override validateConfig(config: TrvCardConfig): void {
    if (!config.entity || !config.entity.startsWith("climate.")) {
      throw new Error("morphic-trv-card requires a `climate.*` entity.");
    }
  }

  public override getGridOptions(): MorphicGridOptions {
    return { columns: 6, rows: 4, min_columns: 4, min_rows: 3 };
  }

  public override getCardSize(): number {
    return 4;
  }

  // ---- Entity helpers ------------------------------------------------------

  private get stateObj(): HassEntity | undefined {
    const id = this._config?.entity;
    return id ? this.hass?.states[id] : undefined;
  }

  private get step(): number {
    return this._config?.step ?? (this.stateObj?.attributes.target_temp_step as number) ?? 0.5;
  }

  private get unit(): string {
    return this.hass?.config?.unit_system?.temperature ?? "°";
  }

  private get heating(): boolean {
    const s = this.stateObj;
    if (!s) return false;
    const action = s.attributes.hvac_action as string | undefined;
    if (action) return action === "heating";
    return s.state !== "off" && !isUnavailable(s);
  }

  private fmt(n: unknown): string {
    const v = typeof n === "number" ? n : Number(n);
    if (!Number.isFinite(v)) return "—";
    return v.toFixed(this.step % 1 !== 0 ? 1 : 0);
  }

  // ---- Service calls -------------------------------------------------------

  private _adjustTarget(delta: number): void {
    const s = this.stateObj;
    if (!s || !this.hass) return;
    const current = Number(s.attributes.temperature);
    if (!Number.isFinite(current)) return;
    const min = Number(s.attributes.min_temp ?? 7);
    const max = Number(s.attributes.max_temp ?? 35);
    const next = Math.min(max, Math.max(min, current + delta * this.step));
    this.hass.callService("climate", "set_temperature", { temperature: round1(next) }, {
      entity_id: s.entity_id,
    });
  }

  private _setHvacMode(mode: string): void {
    const s = this.stateObj;
    if (!s || !this.hass) return;
    this.hass.callService("climate", "set_hvac_mode", { hvac_mode: mode }, {
      entity_id: s.entity_id,
    });
  }

  private _setPreset(preset: string): void {
    const s = this.stateObj;
    if (!s || !this.hass) return;
    this.hass.callService("climate", "set_preset_mode", { preset_mode: preset }, {
      entity_id: s.entity_id,
    });
  }

  private _toggleHeat(): void {
    const s = this.stateObj;
    if (!s) return;
    const modes = (s.attributes.hvac_modes as string[]) ?? [];
    if (this.heating) {
      this._setHvacMode(modes.includes("off") ? "off" : modes[0] ?? "off");
    } else {
      this._setHvacMode(modes.includes("heat") ? "heat" : modes.find((m) => m !== "off") ?? "heat");
    }
  }

  // ---- Render --------------------------------------------------------------

  protected renderContent(): TemplateResult {
    const s = this.stateObj;
    const name = this._config?.name ?? s?.attributes.friendly_name ?? this._config?.entity ?? "TRV";

    if (!s || isUnavailable(s)) {
      return html`
        <div class="header">
          <div class="title">${name}</div>
        </div>
        <div class="unavailable">
          <ha-icon icon="mdi:thermometer-off"></ha-icon>
          <span>Entity unavailable</span>
        </div>
      `;
    }

    const current = s.attributes.current_temperature;
    const target = s.attributes.temperature;
    const shape = shapeForActive(this.heating);

    return html`
      <div class="header">
        <button
          class="morph ${shape === "squircle" ? "is-active" : ""}"
          part="icon"
          aria-label="Toggle heating"
          @click=${this._toggleHeat}
        >
          <ha-icon icon=${this.heating ? "mdi:fire" : "mdi:radiator-disabled"}></ha-icon>
        </button>
        <div class="titles">
          <div class="title">${name}</div>
          <div class="subtitle">
            ${current !== undefined ? html`Now ${this.fmt(current)}${this.unit}` : nothing}
            ${this.heating ? html`<span class="dot">•</span> Heating` : nothing}
          </div>
        </div>
      </div>

      <div class="target" part="target">
        <button class="step" aria-label="Decrease" @click=${() => this._adjustTarget(-1)}>
          <ha-icon icon="mdi:minus"></ha-icon>
        </button>
        <div class="readout">
          <span class="value">${this.fmt(target)}</span>
          <span class="unit">${this.unit}</span>
        </div>
        <button class="step" aria-label="Increase" @click=${() => this._adjustTarget(1)}>
          <ha-icon icon="mdi:plus"></ha-icon>
        </button>
      </div>

      ${this._renderHvacModes(s)} ${this._renderPresets(s)} ${this._renderExtras(s)}
    `;
  }

  private _renderHvacModes(s: HassEntity): TemplateResult | typeof nothing {
    if (this._config?.show_hvac_modes === false) return nothing;
    const modes = (s.attributes.hvac_modes as string[]) ?? [];
    if (modes.length < 2) return nothing;
    return html`
      <div class="segmented" role="group" aria-label="HVAC mode" part="hvac-modes">
        ${modes.map(
          (m) => html`
            <button
              class="seg ${s.state === m ? "is-active" : ""}"
              @click=${() => this._setHvacMode(m)}
              title=${m}
            >
              <ha-icon icon=${HVAC_ICONS[m] ?? "mdi:thermostat"}></ha-icon>
            </button>
          `,
        )}
      </div>
    `;
  }

  private _renderPresets(s: HassEntity): TemplateResult | typeof nothing {
    if (this._config?.show_presets === false) return nothing;
    const presets = (s.attributes.preset_modes as string[]) ?? [];
    if (presets.length === 0) return nothing;
    const active = s.attributes.preset_mode as string | undefined;
    return html`
      <div class="chips" part="presets">
        ${presets.map(
          (p) => html`
            <button
              class="chip ${active === p ? "is-active" : ""}"
              @click=${() => this._setPreset(p)}
            >
              <ha-icon icon=${PRESET_ICONS[p] ?? "mdi:tune-variant"}></ha-icon>
              <span>${prettyPreset(p)}</span>
            </button>
          `,
        )}
      </div>
    `;
  }

  private _renderExtras(s: HassEntity): TemplateResult | typeof nothing {
    const c = this._config;
    if (!c) return nothing;
    const items: TemplateResult[] = [];

    if (c.show_valve_position) {
      const pos = this._extraState(c.valve_position_entity) ?? s.attributes.valve_position;
      items.push(this._extraItem("mdi:pipe-valve", "Valve", pos !== undefined ? `${pos}%` : "—"));
    }
    if (c.show_battery) {
      const bat = this._extraState(c.battery_entity) ?? s.attributes.battery_level;
      items.push(this._extraItem("mdi:battery", "Battery", bat !== undefined ? `${bat}%` : "—"));
    }
    if (c.show_window) {
      const win = this._extraState(c.window_entity);
      const open = win === "on" || win === "open" || win === true;
      items.push(
        this._extraItem(open ? "mdi:window-open-variant" : "mdi:window-closed-variant", "Window", open ? "Open" : "Closed"),
      );
    }

    if (items.length === 0) return nothing;
    return html`<div class="extras" part="extras">${items}</div>`;
  }

  private _extraState(entityId?: string): unknown {
    if (!entityId || !this.hass) return undefined;
    return this.hass.states[entityId]?.state;
  }

  private _extraItem(icon: string, label: string, value: string): TemplateResult {
    return html`
      <div class="extra">
        <ha-icon icon=${icon}></ha-icon>
        <div class="extra-text">
          <span class="extra-value">${value}</span>
          <span class="extra-label">${label}</span>
        </div>
      </div>
    `;
  }

  static override styles: CSSResultGroup = [
    MorphicCard.styles as CSSResultGroup,
    iconMorphStyles,
    css`
      .morphic-root {
        display: flex;
        flex-direction: column;
        gap: var(--morphic-gap);
        padding: 16px;
      }

      .header {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .titles {
        min-width: 0;
      }
      .title {
        font-weight: 600;
        font-size: 1.05rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--morphic-on-surface);
      }
      .subtitle {
        font-size: 0.82rem;
        color: var(--morphic-on-surface-variant);
      }
      .subtitle .dot {
        margin: 0 4px;
        color: var(--morphic-accent);
      }

      /* Prominent target temperature stepper. */
      .target {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
        padding: 8px 0;
      }
      .step {
        inline-size: 56px;
        block-size: 56px;
        min-inline-size: 48px;
        min-block-size: 48px;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: inline-grid;
        place-items: center;
        background: var(--morphic-accent-container);
        color: var(--morphic-on-accent-container);
        transition: transform 160ms var(--morphic-shape-easing), background-color 200ms ease;
        --mdc-icon-size: 26px;
      }
      .step:active {
        transform: scale(0.92);
      }
      .step:focus-visible {
        outline: 2px solid var(--morphic-accent);
        outline-offset: 2px;
      }
      .readout {
        display: flex;
        align-items: flex-start;
        line-height: 1;
        color: var(--morphic-on-surface);
        min-inline-size: 3ch;
        justify-content: center;
      }
      .readout .value {
        font-size: clamp(2.6rem, 18cqw, 4rem);
        font-weight: 700;
        font-variant-numeric: tabular-nums;
      }
      .readout .unit {
        font-size: 1.1rem;
        font-weight: 600;
        margin-top: 0.35em;
        color: var(--morphic-on-surface-variant);
      }

      .segmented {
        display: flex;
        gap: 4px;
        padding: 4px;
        border-radius: 999px;
        background: var(--md-sys-color-surface-container-high, var(--morphic-surface));
      }
      .seg {
        flex: 1 1 0;
        min-block-size: 44px;
        border: none;
        border-radius: 999px;
        cursor: pointer;
        background: transparent;
        color: var(--morphic-on-surface-variant);
        display: inline-grid;
        place-items: center;
        transition: background-color 200ms ease, color 200ms ease;
        --mdc-icon-size: 22px;
      }
      .seg.is-active {
        background: var(--morphic-accent);
        color: var(--morphic-on-accent);
      }

      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-block-size: 40px;
        padding: 0 14px;
        border-radius: 999px;
        border: 1px solid var(--morphic-outline);
        background: transparent;
        color: var(--morphic-on-surface);
        cursor: pointer;
        font-size: 0.85rem;
        transition: background-color 200ms ease, color 200ms ease, border-color 200ms ease;
        --mdc-icon-size: 18px;
      }
      .chip.is-active {
        background: var(--morphic-accent-container);
        color: var(--morphic-on-accent-container);
        border-color: transparent;
      }

      .extras {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        padding-top: 4px;
        border-top: 1px solid var(--morphic-outline);
      }
      .extra {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--morphic-on-surface-variant);
        --mdc-icon-size: 20px;
      }
      .extra-text {
        display: flex;
        flex-direction: column;
        line-height: 1.1;
      }
      .extra-value {
        font-weight: 600;
        color: var(--morphic-on-surface);
      }
      .extra-label {
        font-size: 0.72rem;
      }

      .unavailable {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--morphic-on-surface-variant);
        padding: 12px 0;
        --mdc-icon-size: 22px;
      }

      /* Sections-first responsiveness via container queries (no fixed px width). */
      @container morphic (max-width: 240px) {
        .chip span {
          display: none;
        }
        .target {
          gap: 10px;
        }
      }
      @container morphic (min-width: 420px) {
        .morphic-root {
          padding: 20px 22px;
        }
      }
    `,
  ];
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function prettyPreset(p: string): string {
  return p.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

declare global {
  interface HTMLElementTagNameMap {
    "morphic-trv-card": MorphicTrvCard;
  }
}
