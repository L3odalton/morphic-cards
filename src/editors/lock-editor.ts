// GUI editor for the Morphic Lock Card.

import { html, css, nothing, type TemplateResult, type CSSResultGroup } from "lit";
import { customElement, state } from "lit/decorators.js";

import { MorphicEditorBase, type HaFormSchema } from "./base-editor";
import type { LockCardConfig, LockChipConfig } from "../cards/lock-card";
import { fireEvent } from "../shared/ha";
import { morphicBaseTokens } from "../shared/tokens";

@customElement("morphic-lock-card-editor")
export class MorphicLockCardEditor extends MorphicEditorBase<LockCardConfig> {
  @state() private _expandedChip = -1;

  protected override schema(): HaFormSchema[] {
    return [
      { name: "entity", required: true, selector: { entity: { domain: "lock" } } },
      { name: "name", selector: { text: {} } },
      { name: "icon", selector: { icon: {} } },
      {
        type: "grid",
        name: "",
        schema: [
          { name: "show_state", selector: { boolean: {} } },
          { name: "show_open", selector: { boolean: {} } },
        ],
      },
      {
        type: "grid",
        name: "",
        schema: [
          { name: "confirm", selector: { boolean: {} } },
          { name: "confirm_open", selector: { boolean: {} } },
        ],
      },
      { name: "confirm_text", selector: { text: {} } },
      {
        type: "expandable",
        name: "",
        title: "Card actions",
        icon: "mdi:gesture-tap",
        schema: [
          { name: "tap_action", selector: { ui_action: {} } },
          { name: "hold_action", selector: { ui_action: {} } },
        ],
      },
      {
        type: "expandable",
        name: "",
        title: "Appearance & accent",
        icon: "mdi:palette",
        schema: [
          { name: "color", selector: { text: {} } },
          { name: "color_key", selector: { text: {} } },
          {
            type: "grid",
            name: "",
            schema: [
              { name: "harmonize", selector: { boolean: {} } },
              { name: "flat_fill", selector: { boolean: {} } },
            ],
          },
          {
            name: "accent_intensity",
            selector: { number: { min: 0, max: 0.4, step: 0.02, mode: "slider" } },
          },
        ],
      },
      {
        type: "expandable",
        name: "",
        title: "Card-Mod (custom CSS)",
        icon: "mdi:language-css3",
        schema: [
          { name: "card_mod_style", selector: { text: { multiline: true } } },
        ],
      },
    ];
  }

  protected override labels(): Record<string, string> {
    return {
      entity: "Lock entity",
      name: "Name (overrides friendly name)",
      icon: "Icon (defaults to entity icon)",
      show_state: "Show state text",
      show_open: "Show open button",
      confirm: "Confirm lock/unlock",
      confirm_open: "Confirm open",
      confirm_text: "Confirmation text",
      tap_action: "Tap action",
      hold_action: "Hold action",
      color: "Accent override",
      color_key: "Color key",
      harmonize: "Harmonize to theme",
      flat_fill: "Flat fill (no gradient)",
      accent_intensity: "Accent fill intensity",
    };
  }

  protected override helpers(): Record<string, string> {
    return {
      show_open: "Show an open chip when the lock supports it. Auto-detected from the entity.",
      confirm: "Show a full-card confirmation overlay before executing the tap action.",
      confirm_open: "Require confirmation before opening the lock (independent of main confirm).",
      confirm_text: 'Custom confirmation message. Defaults to "Are you sure?".',
      tap_action: "Default: toggle lock/unlock.",
    };
  }

  protected override withDefaults(config: LockCardConfig): LockCardConfig {
    return {
      show_state: true,
      show_open: true,
      ...config,
    };
  }

  // ---- Chip management (same pattern as room card) --------------------------

  private get _chips(): LockChipConfig[] {
    return this._config?.chips ?? [];
  }

  private _fireChipConfig(chips: LockChipConfig[]): void {
    if (!this._config) return;
    fireEvent(this, "config-changed", { config: { ...this._config, chips } });
  }

  private _addChip(): void {
    if (this._chips.length >= 4) return;
    const chips = [...this._chips, { entity: "" }];
    this._expandedChip = chips.length - 1;
    this._fireChipConfig(chips);
  }

  private _removeChip(index: number): void {
    const chips = this._chips.filter((_, i) => i !== index);
    if (this._expandedChip >= chips.length) this._expandedChip = -1;
    this._fireChipConfig(chips);
  }

  private _moveChip(index: number, direction: -1 | 1): void {
    const target = index + direction;
    if (target < 0 || target >= this._chips.length) return;
    const chips = [...this._chips];
    [chips[index], chips[target]] = [chips[target], chips[index]];
    this._expandedChip = target;
    this._fireChipConfig(chips);
  }

  private _chipFieldChanged(index: number, field: string, ev: Event): void {
    const value = (ev as CustomEvent).detail?.value ?? (ev.target as HTMLElement & { value?: unknown }).value ?? "";
    const chips = [...this._chips];
    chips[index] = { ...chips[index], [field]: value || undefined };
    this._fireChipConfig(chips);
  }

  private _chipActionChanged(index: number, field: string, ev: CustomEvent): void {
    ev.stopPropagation();
    const chips = [...this._chips];
    chips[index] = { ...chips[index], [field]: ev.detail?.value };
    this._fireChipConfig(chips);
  }

  private _toggleChip(index: number): void {
    this._expandedChip = this._expandedChip === index ? -1 : index;
  }

  // ---- Render ---------------------------------------------------------------

  override render(): TemplateResult {
    if (!this.hass || !this._config) return html``;
    return html`
      <div class="editor" part="editor">
        <ha-form
          .hass=${this.hass}
          .data=${this._config}
          .schema=${this.schema()}
          .computeLabel=${this._labelFn}
          .computeHelper=${this._helperFn}
          @value-changed=${this._onFormChanged}
        ></ha-form>

        <div class="chips-label">
          <ha-icon icon="mdi:circle-multiple"></ha-icon>
          <span>Chips</span>
        </div>
        <div class="chips-section">
          ${this._chips.map((chip, i) => this._renderChipItem(chip, i))}
          ${this._chips.length < 4
            ? html`<button class="add-chip" @click=${this._addChip}>
                <ha-icon icon="mdi:plus"></ha-icon> Add chip
              </button>`
            : nothing}
        </div>
      </div>
    `;
  }

  private _renderChipItem(chip: LockChipConfig, index: number): TemplateResult {
    const expanded = this._expandedChip === index;
    const entityState = chip.entity ? this.hass?.states[chip.entity] : undefined;
    const label = entityState?.attributes.friendly_name ?? chip.entity ?? "Empty";
    return html`
      <div class="chip-item ${expanded ? "is-expanded" : ""}">
        <div class="chip-item-header" @click=${() => this._toggleChip(index)}>
          <ha-icon icon=${chip.icon ?? entityState?.attributes.icon ?? "mdi:circle-outline"} class="chip-icon"></ha-icon>
          <span class="chip-label">${label}</span>
          <div class="chip-controls" @click=${(e: Event) => e.stopPropagation()}>
            <button class="ctrl" ?disabled=${index === 0} @click=${() => this._moveChip(index, -1)} title="Move up">
              <ha-icon icon="mdi:arrow-up"></ha-icon>
            </button>
            <button class="ctrl" ?disabled=${index === this._chips.length - 1} @click=${() => this._moveChip(index, 1)} title="Move down">
              <ha-icon icon="mdi:arrow-down"></ha-icon>
            </button>
            <button class="ctrl remove" @click=${() => this._removeChip(index)} title="Remove">
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </div>
        </div>
        ${expanded ? html`
          <div class="chip-fields">
            <ha-entity-picker .hass=${this.hass} .value=${chip.entity ?? ""} @value-changed=${(ev: CustomEvent) => this._chipFieldChanged(index, "entity", ev)} allow-custom-entity></ha-entity-picker>
            <ha-icon-picker .hass=${this.hass} .value=${chip.icon ?? ""} .label=${"Icon (auto if empty)"} @value-changed=${(ev: CustomEvent) => this._chipFieldChanged(index, "icon", ev)}></ha-icon-picker>
            <ha-selector .hass=${this.hass} .selector=${{ boolean: {} }} .value=${chip.confirm ?? false} .label=${"Require confirmation"} @value-changed=${(ev: CustomEvent) => this._chipFieldChanged(index, "confirm", ev)}></ha-selector>
            <ha-selector .hass=${this.hass} .selector=${{ ui_action: {} }} .value=${chip.tap_action} .label=${"Tap action"} @value-changed=${(ev: CustomEvent) => this._chipActionChanged(index, "tap_action", ev)}></ha-selector>
          </div>
        ` : nothing}
      </div>
    `;
  }

  private get _labelFn() {
    const map = this.labels();
    return (schema: { name: string; title?: string }): string =>
      map[schema.name] ?? schema.title ?? schema.name.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
  }

  private get _helperFn() {
    const h = this.helpers();
    return (schema: { name: string }): string | undefined => h[schema.name];
  }

  private _onFormChanged(ev: CustomEvent): void {
    ev.stopPropagation();
    if (!this._config) return;
    const merged = { ...this._config, ...ev.detail.value } as Record<string, unknown>;
    const styleStr = (merged.card_mod_style as string) ?? "";
    delete merged.card_mod_style;
    if (styleStr.trim()) {
      merged.card_mod = { style: styleStr };
    } else {
      delete merged.card_mod;
    }
    fireEvent(this, "config-changed", { config: merged as LockCardConfig });
  }

  override setConfig(config: LockCardConfig): void {
    const flat = { ...config } as Record<string, unknown>;
    const cardMod = flat.card_mod as { style?: string } | undefined;
    if (cardMod?.style) flat.card_mod_style = cardMod.style;
    this._config = flat as LockCardConfig;
  }

  static override styles: CSSResultGroup = [
    morphicBaseTokens,
    css`
      :host { display: block; }
      .editor {
        display: flex;
        flex-direction: column;
        gap: var(--morphic-gap);
        padding: 4px 2px 8px;
        --primary-color: var(--morphic-accent, var(--md-sys-color-primary));
        --mdc-theme-primary: var(--morphic-accent, var(--md-sys-color-primary));
      }
      ha-form { display: block; }

      .chips-label {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 4px 2px;
        font-size: 0.85rem;
        font-weight: 500;
        letter-spacing: 0.03em;
        text-transform: uppercase;
        color: var(--secondary-text-color, var(--morphic-on-surface-variant));
        --mdc-icon-size: 16px;
      }
      .chips-section {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .chip-item {
        border-radius: 12px;
        background: var(--md-sys-color-surface-container-high, rgba(255,255,255,0.05));
        overflow: hidden;
      }
      .chip-item-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        cursor: pointer;
      }
      .chip-icon { --mdc-icon-size: 20px; color: var(--morphic-on-surface-variant); }
      .chip-label {
        flex: 1;
        font-size: 0.9rem;
        color: var(--morphic-on-surface);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .chip-controls { display: flex; gap: 2px; }
      .ctrl {
        display: inline-grid;
        place-items: center;
        inline-size: 30px;
        block-size: 30px;
        border: none;
        border-radius: 8px;
        background: transparent;
        color: var(--morphic-on-surface-variant);
        cursor: pointer;
        --mdc-icon-size: 16px;
        padding: 0;
      }
      .ctrl:hover { background: rgba(255,255,255,0.08); }
      .ctrl:disabled { opacity: 0.3; cursor: default; }
      .ctrl:disabled:hover { background: transparent; }
      .ctrl.remove:hover { color: #ef5350; }
      .chip-fields {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 0 12px 12px;
      }
      .add-chip {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 10px;
        border: 1px dashed var(--morphic-outline, rgba(255,255,255,0.12));
        border-radius: 12px;
        background: transparent;
        color: var(--morphic-on-surface-variant);
        cursor: pointer;
        font-size: 0.9rem;
        --mdc-icon-size: 18px;
      }
      .add-chip:hover {
        background: rgba(255,255,255,0.04);
        color: var(--morphic-on-surface);
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "morphic-lock-card-editor": MorphicLockCardEditor;
  }
}
