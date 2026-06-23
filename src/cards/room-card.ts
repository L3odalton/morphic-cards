// Morphic Room Card — a navigable room tile for dashboards.
// Tapping the card navigates to a view or opens a Bubble Card pop-up.
// Chips show entity states (window, motion, lights, etc.) at a glance.

import { html, css, nothing, type TemplateResult, type CSSResultGroup } from "lit";
import { customElement } from "lit/decorators.js";

import { MorphicCard, type MorphicBaseConfig } from "../shared/base-card";
import { iconMorphStyles, shapeForActive } from "../shared/shapes";
import type { MorphicGridOptions } from "../shared/grid";
import { type HassEntity, type HomeAssistant, fireEvent, isUnavailable } from "../shared/ha";
import type { ActionConfig } from "../shared/actions";

export interface RoomChipConfig {
  entity: string;
  icon?: string;
  active_color?: string;
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
}

export interface RoomCardConfig extends MorphicBaseConfig {
  icon?: string;
  name?: string;
  temperature_entity?: string;
  humidity_entity?: string;
  chips?: RoomChipConfig[];
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
}

@customElement("morphic-room-card")
export class MorphicRoomCard extends MorphicCard<RoomCardConfig> {
  static getConfigElement(): HTMLElement {
    return document.createElement("morphic-room-card-editor");
  }

  static getStubConfig(_hass: HomeAssistant): RoomCardConfig {
    return {
      type: "custom:morphic-room-card",
      name: "Living Room",
      icon: "mdi:sofa",
      tap_action: { action: "navigate", navigation_path: "/" },
    };
  }

  public override getGridOptions(): MorphicGridOptions {
    return { columns: 6, rows: 2, min_columns: 3, min_rows: 2 };
  }

  public override getCardSize(): number {
    return 2;
  }

  // ---- Helpers --------------------------------------------------------------

  private get resolvedIcon(): string {
    return this._config?.icon ?? "mdi:door-open";
  }


  private _isActive(s: HassEntity): boolean {
    return !isUnavailable(s) && s.state !== "off" && s.state !== "closed" && s.state !== "idle" && s.state !== "not_home";
  }

  // ---- Actions --------------------------------------------------------------

  private _handleCardTap(): void {
    const action = this._config?.tap_action ?? { action: "navigate" as const };
    if (action.action === "none") return;
    fireEvent(this, "hass-action", {
      config: {
        entity: this._config?.entity,
        tap_action: this._config?.tap_action ?? { action: "navigate", navigation_path: "/" },
        hold_action: this._config?.hold_action ?? { action: "none" },
        double_tap_action: this._config?.double_tap_action ?? { action: "none" },
      },
      action: "tap",
    });
  }

  private _handleCardHold(): void {
    const action = this._config?.hold_action ?? { action: "none" as const };
    if (action.action === "none") return;
    fireEvent(this, "hass-action", {
      config: {
        entity: this._config?.entity,
        tap_action: this._config?.tap_action ?? { action: "navigate", navigation_path: "/" },
        hold_action: this._config?.hold_action ?? { action: "none" },
        double_tap_action: this._config?.double_tap_action ?? { action: "none" },
      },
      action: "hold",
    });
  }

  private _handleChipAction(c: RoomChipConfig, action: "tap" | "hold" | "double_tap", ev: Event): void {
    ev.stopPropagation();
    const actionConfig = action === "tap" ? c.tap_action : action === "hold" ? c.hold_action : c.double_tap_action;
    if (!actionConfig || actionConfig.action === "none") return;
    fireEvent(this, "hass-action", {
      config: {
        entity: c.entity,
        tap_action: c.tap_action ?? { action: "more-info" },
        hold_action: c.hold_action ?? { action: "none" },
        double_tap_action: c.double_tap_action ?? { action: "none" },
      },
      action,
    });
  }

  // ---- Render ---------------------------------------------------------------

  protected renderContent(): TemplateResult {
    const name = this._config?.name ?? "Room";
    const icon = this.resolvedIcon;
    const shape = shapeForActive(false);
    const chips = this._config?.chips ?? [];

    const tempState = this._config?.temperature_entity
      ? this.hass?.states[this._config.temperature_entity]
      : undefined;
    const humState = this._config?.humidity_entity
      ? this.hass?.states[this._config.humidity_entity]
      : undefined;

    const readings: string[] = [];
    if (tempState && !isUnavailable(tempState)) {
      const unit = tempState.attributes.unit_of_measurement ?? "°";
      readings.push(`${tempState.state}${unit}`);
    }
    if (humState && !isUnavailable(humState)) {
      const unit = humState.attributes.unit_of_measurement ?? "%";
      readings.push(`${humState.state}${unit}`);
    }

    return html`
      <div class="room" @click=${this._handleCardTap} @contextmenu=${(e: Event) => { e.preventDefault(); this._handleCardHold(); }}>
        <div class="header">
          <div class="morph ${shape === "squircle" ? "is-active" : ""}" part="icon">
            <ha-icon icon=${icon}></ha-icon>
          </div>
          <div class="info">
            <div class="name">${name}</div>
            ${readings.length
              ? html`<div class="readings">${readings.join(" · ")}</div>`
              : nothing}
          </div>
          <ha-icon class="chevron" icon="mdi:chevron-right"></ha-icon>
        </div>
        ${chips.length
          ? html`<div class="chips">${chips.map((c) => this._renderChip(c))}</div>`
          : nothing}
      </div>
    `;
  }

  private _renderChip(c: RoomChipConfig): TemplateResult {
    const s = this.hass?.states[c.entity];
    if (!s) {
      return html`
        <button class="chip" disabled>
          <ha-icon icon=${c.icon ?? "mdi:help-circle-outline"}></ha-icon>
        </button>
      `;
    }
    const active = this._isActive(s);
    const hasAction = (c.tap_action && c.tap_action.action !== "none") ||
      (c.hold_action && c.hold_action.action !== "none");
    return html`
      <button
        class="chip ${active ? "is-active" : ""}"
        ?disabled=${!hasAction}
        @click=${(ev: Event) => this._handleChipAction(c, "tap", ev)}
        @contextmenu=${(ev: Event) => { ev.preventDefault(); this._handleChipAction(c, "hold", ev); }}
        @dblclick=${(ev: Event) => this._handleChipAction(c, "double_tap", ev)}
      >
        ${c.icon
          ? html`<ha-icon icon=${c.icon}></ha-icon>`
          : html`<ha-state-icon .hass=${this.hass} .stateObj=${s}></ha-state-icon>`}
      </button>
    `;
  }

  static override styles: CSSResultGroup = [
    MorphicCard.styles as CSSResultGroup,
    iconMorphStyles,
    css`
      .morphic-root {
        display: flex;
        align-items: center;
        padding: 14px 16px;
      }

      .room {
        display: flex;
        flex-direction: column;
        gap: 10px;
        inline-size: 100%;
        cursor: pointer;
      }

      .header {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .morph {
        --morphic-icon-container-size: 44px;
        min-inline-size: 44px;
        min-block-size: 44px;
      }

      .info {
        flex: 1;
        min-inline-size: 0;
      }
      .name {
        font-weight: 600;
        font-size: 1.05rem;
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--morphic-on-surface);
      }
      .readings {
        font-size: 0.82rem;
        line-height: 1.2;
        color: var(--morphic-on-surface-variant);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .chevron {
        flex-shrink: 0;
        color: var(--morphic-on-surface-variant);
        opacity: 0.5;
        --mdc-icon-size: 20px;
      }

      .chips {
        display: flex;
        gap: 6px;
      }

      .chip {
        display: inline-grid;
        place-items: center;
        inline-size: 36px;
        block-size: 36px;
        min-inline-size: 36px;
        min-block-size: 36px;
        border-radius: 12px;
        border: none;
        background: var(--md-sys-color-surface-container-high, var(--morphic-surface));
        color: var(--morphic-on-surface-variant);
        cursor: default;
        transition: background-color 200ms ease, color 200ms ease;
        --mdc-icon-size: 18px;
        padding: 0;
      }
      .chip:not(:disabled) {
        cursor: pointer;
      }
      .chip:not(:disabled):active {
        transform: scale(0.92);
      }
      .chip.is-active {
        background: var(--morphic-accent-container);
        color: var(--morphic-on-accent-container);
      }

      .room:active .morphic-root {
        opacity: 0.92;
      }

    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "morphic-room-card": MorphicRoomCard;
  }
}
