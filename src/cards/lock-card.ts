// Morphic Lock Card — a compact card for lock.* entities with optional
// inline confirmation overlay before executing the tap action.

import { html, css, nothing, type TemplateResult, type CSSResultGroup } from "lit";
import { customElement, state } from "lit/decorators.js";

import { MorphicCard, type MorphicBaseConfig } from "../shared/base-card";
import { iconMorphStyles, shapeForActive } from "../shared/shapes";
import type { MorphicGridOptions } from "../shared/grid";
import { type HassEntity, type HomeAssistant, fireEvent, isUnavailable } from "../shared/ha";
import { type ActionConfig, bindActionHandler } from "../shared/actions";
import { localize } from "../shared/localize";

export interface LockChipConfig {
  entity: string;
  icon?: string;
  confirm?: boolean;
  confirm_text?: string;
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
}

export interface LockCardConfig extends MorphicBaseConfig {
  entity: string;
  icon?: string;
  name?: string;
  show_state?: boolean;
  show_open?: boolean;
  confirm_open?: boolean;
  confirm?: boolean;
  confirm_text?: string;
  chips?: LockChipConfig[];
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
}

@customElement("morphic-lock-card")
export class MorphicLockCard extends MorphicCard<LockCardConfig> {
  @state() private _confirming = false;
  private _confirmTimer?: ReturnType<typeof setTimeout>;
  private _pendingAction?: () => void;
  private _confirmText?: string;
  private _cleanupActions?: () => void;

  static getConfigElement(): HTMLElement {
    return document.createElement("morphic-lock-card-editor");
  }

  static getStubConfig(hass: HomeAssistant): LockCardConfig {
    const lock = Object.keys(hass?.states ?? {}).find((id) => id.startsWith("lock."));
    return {
      type: "custom:morphic-lock-card",
      entity: lock ?? "lock.front_door",
      tap_action: { action: "toggle" },
    };
  }

  protected override validateConfig(config: LockCardConfig): void {
    if (!config.entity) {
      throw new Error("morphic-lock-card requires an entity.");
    }
  }

  public override getGridOptions(): MorphicGridOptions {
    return { columns: 12, rows: 1, min_columns: 3, min_rows: 1 };
  }

  public override getCardSize(): number {
    return 1;
  }

  // ---- Helpers --------------------------------------------------------------

  private get stateObj(): HassEntity | undefined {
    const id = this._config?.entity;
    return id ? this.hass?.states[id] : undefined;
  }

  private get isLocked(): boolean {
    return this.stateObj?.state === "locked";
  }

  private get supportsOpen(): boolean {
    return (((this.stateObj?.attributes.supported_features as number) ?? 0) & 1) !== 0;
  }

  private get _showOpenChip(): boolean {
    if (this._config?.show_open === false) return false;
    return this.supportsOpen;
  }

  private get resolvedIcon(): string {
    if (this._config?.icon) return this._config.icon;
    const entityIcon = this.stateObj?.attributes.icon as string | undefined;
    if (entityIcon) return entityIcon;
    return this.isLocked ? "mdi:lock" : "mdi:lock-open-variant";
  }

  private t(key: string): string {
    return localize(this.hass?.language, key);
  }

  private _isActive(s: HassEntity): boolean {
    return !isUnavailable(s) && s.state !== "off" && s.state !== "closed" && s.state !== "idle" && s.state !== "locked";
  }

  // ---- Actions --------------------------------------------------------------

  protected override firstUpdated(): void {
    super.firstUpdated();
    this._bindCardActions();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._cleanupActions?.();
    this._cleanupActions = undefined;
    this._clearConfirm();
  }

  private _bindCardActions(): void {
    this._cleanupActions?.();
    const row = this.shadowRoot?.querySelector<HTMLElement>(".lock-row");
    if (!row) return;
    this._cleanupActions = bindActionHandler(
      row,
      () => this._handleTap(),
      () => this._handleHold(),
    );
  }

  private _handleTap(): void {
    const execute = () => {
      const action = this._config?.tap_action ?? { action: "toggle" as const };
      if (action.action === "none") return;
      if (action.action === "toggle" && this.stateObj) {
        const service = this.isLocked ? "unlock" : "lock";
        this.hass?.callService("lock", service, {}, { entity_id: this._config!.entity });
        return;
      }
      fireEvent(this, "hass-action", {
        config: {
          entity: this._config?.entity,
          tap_action: this._config?.tap_action ?? { action: "toggle" },
          hold_action: this._config?.hold_action ?? { action: "more-info" },
          double_tap_action: this._config?.double_tap_action ?? { action: "none" },
        },
        action: "tap",
      });
    };

    if (this._config?.confirm) {
      this._showConfirm(execute, this._config.confirm_text);
    } else {
      execute();
    }
  }

  private _handleHold(): void {
    const action = this._config?.hold_action ?? { action: "more-info" as const };
    if (action.action === "none") return;
    fireEvent(this, "hass-action", {
      config: {
        entity: this._config?.entity,
        tap_action: this._config?.tap_action ?? { action: "toggle" },
        hold_action: this._config?.hold_action ?? { action: "more-info" },
        double_tap_action: this._config?.double_tap_action ?? { action: "none" },
      },
      action: "hold",
    });
  }

  private _handleOpen(ev: Event): void {
    ev.stopPropagation();
    const execute = () => {
      this.hass?.callService("lock", "open", {}, { entity_id: this._config!.entity });
    };
    if (this._config?.confirm_open) {
      this._showConfirm(execute, this.t("confirm_open"));
    } else {
      execute();
    }
  }

  private _handleChipTap(c: LockChipConfig, ev: Event): void {
    ev.stopPropagation();
    const actionConfig = c.tap_action ?? { action: "more-info" as const };
    if (actionConfig.action === "none") return;

    const execute = () => {
      fireEvent(this, "hass-action", {
        config: {
          entity: c.entity,
          tap_action: c.tap_action ?? { action: "more-info" },
          hold_action: c.hold_action ?? { action: "more-info" },
          double_tap_action: c.double_tap_action ?? { action: "none" },
        },
        action: "tap",
      });
    };

    if (c.confirm) {
      this._showConfirm(execute, c.confirm_text);
    } else {
      execute();
    }
  }

  // ---- Confirmation ---------------------------------------------------------

  private _showConfirm(action: () => void, text?: string): void {
    this._pendingAction = action;
    this._confirmText = text;
    this._confirming = true;
    this._confirmTimer = setTimeout(() => {
      this._clearConfirm();
    }, 5000);
  }

  private _clearConfirm(): void {
    clearTimeout(this._confirmTimer);
    this._confirming = false;
    this._pendingAction = undefined;
    this._confirmText = undefined;
  }

  private _onConfirm(ev: Event): void {
    ev.stopPropagation();
    const action = this._pendingAction;
    this._clearConfirm();
    action?.();
  }

  private _onCancel(ev: Event): void {
    ev.stopPropagation();
    this._clearConfirm();
  }

  // ---- Render ---------------------------------------------------------------

  protected renderContent(): TemplateResult {
    const s = this.stateObj;
    const name = this._config?.name ?? s?.attributes.friendly_name ?? this._config?.entity ?? "Lock";
    const icon = this.resolvedIcon;
    const shape = shapeForActive(!this.isLocked);
    const chips = this._config?.chips ?? [];
    const showState = this._config?.show_state !== false;

    if (!s || isUnavailable(s)) {
      return html`
        <div class="lock-row">
          <div class="morph" part="icon">
            <ha-icon icon="mdi:lock-alert"></ha-icon>
          </div>
          <div class="info">
            <div class="name">${name}</div>
            <div class="state">${this.t("unavailable")}</div>
          </div>
        </div>
      `;
    }

    return html`
      <div class="lock-row">
        <div class="morph ${shape === "squircle" ? "is-active" : ""}" part="icon">
          <ha-icon icon=${icon}></ha-icon>
        </div>
        <div class="info">
          <div class="name">${name}</div>
          ${showState ? html`<div class="state">${this._stateText(s)}</div>` : nothing}
        </div>
        <div class="chips">
          ${this._showOpenChip ? html`
            <button class="chip open-chip" @click=${this._handleOpen} title=${this.t("lock_open")}>
              <ha-icon icon="mdi:door-open"></ha-icon>
            </button>
          ` : nothing}
          ${chips.map((c) => this._renderChip(c))}
        </div>
      </div>
      ${this._confirming ? this._renderConfirmOverlay() : nothing}
    `;
  }

  private _stateText(s: HassEntity): string {
    const state = s.state;
    if (state === "locked") return this.t("locked");
    if (state === "unlocked") return this.t("unlocked");
    if (state === "locking") return this.t("locking");
    if (state === "unlocking") return this.t("unlocking");
    if (state === "jammed") return this.t("jammed");
    return state;
  }

  private _renderChip(c: LockChipConfig): TemplateResult {
    const s = this.hass?.states[c.entity];
    if (!s) {
      return html`<button class="chip" disabled><ha-icon icon=${c.icon ?? "mdi:help-circle-outline"}></ha-icon></button>`;
    }
    const active = this._isActive(s);
    const hasAction = (c.tap_action && c.tap_action.action !== "none") ||
      (c.hold_action && c.hold_action.action !== "none");
    return html`
      <button
        class="chip ${active ? "is-active" : ""}"
        ?disabled=${!hasAction}
        @click=${(ev: Event) => this._handleChipTap(c, ev)}
      >
        ${c.icon
          ? html`<ha-icon icon=${c.icon}></ha-icon>`
          : html`<ha-state-icon .hass=${this.hass} .stateObj=${s}></ha-state-icon>`}
      </button>
    `;
  }

  private _renderConfirmOverlay(): TemplateResult {
    const text = this._confirmText ?? this._config?.confirm_text ?? this.t("confirm_action");
    return html`
      <div class="confirm-overlay" @click=${(e: Event) => e.stopPropagation()}>
        <span class="confirm-text">${text}</span>
        <div class="confirm-actions">
          <button class="confirm-btn cancel" @click=${this._onCancel}>
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
          <button class="confirm-btn accept" @click=${this._onConfirm}>
            <ha-icon icon="mdi:check"></ha-icon>
          </button>
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
        align-items: center;
        padding: 8px 14px;
        position: relative;
      }

      .lock-row {
        display: flex;
        align-items: center;
        gap: 12px;
        inline-size: 100%;
        cursor: pointer;
      }

      .morph {
        --morphic-icon-container-size: 40px;
        min-inline-size: 40px;
        min-block-size: 40px;
      }

      .info {
        flex: 1;
        min-inline-size: 0;
      }
      .name {
        font-weight: 600;
        font-size: 0.95rem;
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--morphic-on-surface);
      }
      .state {
        font-size: 0.78rem;
        line-height: 1.2;
        color: var(--morphic-on-surface-variant);
        white-space: nowrap;
        text-transform: capitalize;
      }

      .chips {
        display: flex;
        gap: 6px;
        flex-shrink: 0;
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
      .chip:not(:disabled) { cursor: pointer; }
      .chip:not(:disabled):active { transform: scale(0.92); }
      .chip.is-active {
        background: var(--morphic-accent-container);
        color: var(--morphic-on-accent-container);
      }
      .chip.open-chip {
        background: var(--morphic-accent);
        color: var(--morphic-on-accent);
        cursor: pointer;
      }

      /* ---- Confirmation overlay ---- */
      .confirm-overlay {
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: var(--morphic-accent);
        color: var(--morphic-on-accent);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 14px;
        z-index: 2;
        animation: confirm-in 200ms cubic-bezier(0.2, 0, 0, 1);
      }
      @keyframes confirm-in {
        from { opacity: 0; transform: scale(0.97); }
        to { opacity: 1; transform: scale(1); }
      }
      .confirm-text {
        font-weight: 600;
        font-size: 0.95rem;
      }
      .confirm-actions {
        display: flex;
        gap: 8px;
      }
      .confirm-btn {
        display: inline-grid;
        place-items: center;
        inline-size: 40px;
        block-size: 40px;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        --mdc-icon-size: 20px;
        padding: 0;
        transition: transform 120ms ease;
      }
      .confirm-btn:active { transform: scale(0.9); }
      .confirm-btn.cancel {
        background: color-mix(in srgb, var(--morphic-on-accent) 15%, transparent);
        color: var(--morphic-on-accent);
      }
      .confirm-btn.accept {
        background: var(--morphic-on-accent);
        color: var(--morphic-accent);
      }

      @media (prefers-reduced-motion: reduce) {
        .confirm-overlay { animation: none; }
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "morphic-lock-card": MorphicLockCard;
  }
}
