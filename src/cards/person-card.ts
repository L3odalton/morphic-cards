// Morphic Person Card.
// A compact, mobile-first card for person.* entities. Shows the person's icon
// with configurable indicator bubbles positioned at 45° increments around it,
// useful for showing zone, device tracker state, battery, etc.

import { html, css, nothing, type TemplateResult, type CSSResultGroup } from "lit";
import { customElement } from "lit/decorators.js";

import { MorphicCard, type MorphicBaseConfig } from "../shared/base-card";
import { iconMorphStyles, shapeForActive } from "../shared/shapes";
import type { MorphicGridOptions } from "../shared/grid";
import { type HassEntity, type HomeAssistant, isUnavailable } from "../shared/ha";
import { type ActionConfig, bindActionHandler, fireAction } from "../shared/actions";
import { localize } from "../shared/localize";

export interface BubbleStateConfig {
  state: string;
  color?: string;
}

export interface BubbleConfig {
  position: 0 | 45 | 90 | 135 | 180 | 225 | 270 | 315;
  entity?: string;
  conditions: BubbleStateConfig[];
}

export interface PersonCardConfig extends MorphicBaseConfig {
  entity: string;
  icon?: string;
  show_zone?: boolean;
  bubbles?: BubbleConfig[];
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
}

const ZONE_COLORS: Record<string, string> = {
  home: "var(--morphic-accent)",
  not_home: "var(--morphic-on-surface-variant)",
  away: "var(--morphic-on-surface-variant)",
  work: "var(--morphic-accent)",
  school: "var(--morphic-accent)",
  unknown: "var(--morphic-on-surface-variant)",
};

@customElement("morphic-person-card")
export class MorphicPersonCard extends MorphicCard<PersonCardConfig> {
  static getConfigElement(): HTMLElement {
    return document.createElement("morphic-person-card-editor");
  }

  static getStubConfig(hass: HomeAssistant): PersonCardConfig {
    const person = Object.keys(hass?.states ?? {}).find((id) => id.startsWith("person."));
    return { type: "custom:morphic-person-card", entity: person ?? "person.me" };
  }

  protected override validateConfig(config: PersonCardConfig): void {
    if (!config.entity || !config.entity.startsWith("person.")) {
      throw new Error("morphic-person-card requires a `person.*` entity.");
    }
  }

  public override getGridOptions(): MorphicGridOptions {
    return { columns: 6, rows: 1, min_columns: 3, min_rows: 1 };
  }

  public override getCardSize(): number {
    return 1;
  }

  private _cleanupActions?: () => void;

  // ---- Entity helpers ------------------------------------------------------

  private get stateObj(): HassEntity | undefined {
    const id = this._config?.entity;
    return id ? this.hass?.states[id] : undefined;
  }

  private get zone(): string {
    return this.stateObj?.state ?? "unknown";
  }

  private get isHome(): boolean {
    return this.zone === "home";
  }

  private get resolvedIcon(): string {
    if (this._config?.icon) return this._config.icon;
    const entityIcon = this.stateObj?.attributes.icon as string | undefined;
    if (entityIcon) return entityIcon;
    const picture = this.stateObj?.attributes.entity_picture as string | undefined;
    if (picture) return "";
    return "mdi:account";
  }

  private get entityPicture(): string | undefined {
    if (this._config?.icon) return undefined;
    return this.stateObj?.attributes.entity_picture as string | undefined;
  }

  private t(key: string): string {
    return localize(this.hass?.language, key);
  }

  // ---- Icon actions --------------------------------------------------------

  private _handleTap(): void {
    const action = this._config?.tap_action ?? { action: "more-info" as const };
    if (action.action === "none") return;
    fireAction(this, {
      entity: this._config?.entity,
      tap_action: this._config?.tap_action ?? { action: "more-info" },
      hold_action: this._config?.hold_action ?? { action: "more-info" },
    }, "tap");
  }

  private _handleHold(): void {
    const action = this._config?.hold_action ?? { action: "more-info" as const };
    if (action.action === "none") return;
    fireAction(this, {
      entity: this._config?.entity,
      tap_action: this._config?.tap_action ?? { action: "more-info" },
      hold_action: this._config?.hold_action ?? { action: "more-info" },
    }, "hold");
  }

  protected override firstUpdated(): void {
    super.firstUpdated();
    this._bindActions();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._cleanupActions?.();
    this._cleanupActions = undefined;
  }

  private _bindActions(): void {
    this._cleanupActions?.();
    const el = this.shadowRoot?.querySelector<HTMLElement>(".person-row");
    if (!el) return;
    this._cleanupActions = bindActionHandler(
      el,
      () => this._handleTap(),
      () => this._handleHold(),
    );
  }

  // ---- Bubble helpers ------------------------------------------------------

  private _resolveBubble(b: BubbleConfig): { color: string } | null {
    const state = b.entity && this.hass ? this.hass.states[b.entity]?.state : this.zone;
    if (!state || !b.conditions?.length) return null;

    const match = b.conditions.find((c) => c.state === state);
    if (!match) return null;

    return { color: match.color ?? ZONE_COLORS[state] ?? "var(--morphic-accent)" };
  }

  // ---- Render --------------------------------------------------------------

  protected renderContent(): TemplateResult {
    const s = this.stateObj;
    const name = this._config?.name ?? s?.attributes.friendly_name ?? this._config?.entity ?? "Person";

    if (!s || isUnavailable(s)) {
      return html`
        <div class="person-row">
          <div class="icon-wrap">
            <button class="morph" part="icon" aria-label=${name}>
              <ha-icon icon="mdi:account-off"></ha-icon>
            </button>
          </div>
          <div class="titles">
            <div class="title">${name}</div>
            <div class="subtitle">${this.t("unavailable")}</div>
          </div>
        </div>
      `;
    }

    const shape = shapeForActive(this.isHome);
    const picture = this.entityPicture;
    const icon = this.resolvedIcon;
    const bubbles = this._config?.bubbles ?? [];
    const zoneName = this._resolveZoneName(s);

    return html`
      <div class="person-row">
        <div class="icon-wrap">
          <div
            class="morph ${shape === "squircle" ? "is-active" : ""}"
            part="icon"
          >
            ${picture
              ? html`<img class="avatar" src=${picture} alt=${name} />`
              : html`<ha-icon icon=${icon}></ha-icon>`}
          </div>
          ${bubbles.map((b) => this._renderBubble(b))}
        </div>
        <div class="titles">
          <div class="title">${name}</div>
          ${this._config?.show_zone ? html`<div class="subtitle">${zoneName}</div>` : nothing}
        </div>
      </div>
    `;
  }

  private _renderBubble(b: BubbleConfig): TemplateResult | typeof nothing {
    const resolved = this._resolveBubble(b);
    if (!resolved) return nothing;
    const pos = b.position ?? 45;
    return html`
      <div
        class="bubble"
        style=${`--_angle: ${pos}deg; --_bubble-color: ${resolved.color}`}
      ></div>
    `;
  }

  private _resolveZoneName(s: HassEntity): string {
    const zone = s.state;
    if (zone === "home") return this.t("home");
    if (zone === "not_home") return this.t("away");
    const zoneEntity = this.hass?.states[`zone.${zone}`];
    if (zoneEntity) return zoneEntity.attributes.friendly_name as string ?? zone;
    return zone.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
  }

  static override styles: CSSResultGroup = [
    MorphicCard.styles as CSSResultGroup,
    iconMorphStyles,
    css`
      :host {
        --_icon: 40px;
        --_bubble: 12px;
      }

      .morphic-root {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px 14px;
      }

      .person-row {
        display: flex;
        align-items: center;
        gap: 12px;
        inline-size: 100%;
        min-inline-size: 0;
        cursor: pointer;
      }

      .icon-wrap {
        position: relative;
        flex-shrink: 0;
        inline-size: var(--_icon);
        block-size: var(--_icon);
      }

      .morph {
        --morphic-icon-container-size: var(--_icon);
        min-inline-size: var(--_icon);
        min-block-size: var(--_icon);
      }

      .avatar {
        inline-size: 100%;
        block-size: 100%;
        object-fit: cover;
        border-radius: inherit;
      }

      .bubble {
        --_size: var(--_bubble);
        --_radius: calc(var(--_icon) / 2 + var(--_size) / 4);
        position: absolute;
        inline-size: var(--_size);
        block-size: var(--_size);
        border-radius: 50%;
        background: var(--_bubble-color, var(--morphic-accent));
        box-shadow: 0 0 0 2px var(--morphic-surface), 0 1px 3px rgba(0, 0, 0, 0.12);
        pointer-events: none;
        z-index: 1;
        animation: bubble-breathe 3.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        top: calc(50% - var(--_size) / 2 - var(--_radius) * cos(var(--_angle)));
        left: calc(50% - var(--_size) / 2 + var(--_radius) * sin(var(--_angle)));
      }

      @keyframes bubble-breathe {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(0.92); }
      }

      @media (prefers-reduced-motion: reduce) {
        .bubble { animation: none; }
      }

      .titles {
        min-inline-size: 0;
        flex: 1;
      }
      .title {
        font-weight: 600;
        font-size: 0.95rem;
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--morphic-on-surface);
      }
      .subtitle {
        font-size: 0.78rem;
        line-height: 1.2;
        color: var(--morphic-on-surface-variant);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* ---- Width breakpoints (container queries) ---- */
      @container morphic (max-width: 160px) {
        .titles {
          display: none;
        }
        .morphic-root {
          justify-content: center;
        }
      }
      @container morphic (min-width: 300px) {
        .title { font-size: 1.05rem; }
        .subtitle { font-size: 0.82rem; }
      }

    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "morphic-person-card": MorphicPersonCard;
  }
}
