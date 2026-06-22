// CORE FEATURE 5: first-class GUI editor base.
// Builds editors on HA's `ha-form` + selectors, M3-token styled, mobile-first,
// with grouped/collapsible sections. HA renders the live card preview itself
// when an editor is provided via the card's static getConfigElement().

import { LitElement, html, css, type TemplateResult, type CSSResultGroup } from "lit";
import { property, state } from "lit/decorators.js";

import type { HomeAssistant, LovelaceCardConfig, LovelaceCardEditor } from "../shared/ha";
import { fireEvent } from "../shared/ha";
import { morphicBaseTokens } from "../shared/tokens";

/** Minimal ha-form schema shape (selectors are passed straight through). */
export interface HaFormBaseSchema {
  name: string;
  required?: boolean;
  selector?: Record<string, unknown>;
}
export interface HaFormExpandableSchema {
  type: "expandable";
  name: string;
  title?: string;
  icon?: string;
  expanded?: boolean;
  schema: HaFormSchema[];
}
export interface HaFormGridSchema {
  type: "grid";
  name: string;
  schema: HaFormSchema[];
}
export type HaFormSchema = HaFormBaseSchema | HaFormExpandableSchema | HaFormGridSchema;

export abstract class MorphicEditorBase<
  TConfig extends LovelaceCardConfig = LovelaceCardConfig,
> extends LitElement
  implements LovelaceCardEditor
{
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() protected _config?: TConfig;

  public setConfig(config: TConfig): void {
    const flat = { ...config } as Record<string, unknown>;
    const cardMod = flat.card_mod as { style?: string } | undefined;
    if (cardMod?.style) {
      flat.card_mod_style = cardMod.style;
    }
    this._config = flat as TConfig;
  }

  /** Subclasses provide the ha-form schema (may use expandable groups). */
  protected abstract schema(): HaFormSchema[];

  private _fullSchema(): HaFormSchema[] {
    return [
      ...this.schema(),
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

  /** Optional human labels per field name. */
  protected labels(): Record<string, string> {
    return {};
  }

  /** Optional helper text per field name. */
  protected helpers(): Record<string, string> {
    return {};
  }

  /** Apply sane defaults before emitting config (subclasses may override). */
  protected withDefaults(config: TConfig): TConfig {
    return config;
  }

  private static readonly _baseLabels: Record<string, string> = {
    card_mod_style: "Custom CSS",
  };

  private static readonly _baseHelpers: Record<string, string> = {
    card_mod_style:
      "Card-Mod CSS applied to this card. Use --morphic-* tokens for theming.",
  };

  private _computeLabel = (schema: { name: string; title?: string }): string => {
    const map = this.labels();
    return map[schema.name] ?? MorphicEditorBase._baseLabels[schema.name] ?? schema.title ?? prettify(schema.name);
  };

  private _computeHelper = (schema: { name: string }): string | undefined => {
    return this.helpers()[schema.name] ?? MorphicEditorBase._baseHelpers[schema.name];
  };

  private _valueChanged(ev: CustomEvent): void {
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

    const next = this.withDefaults(merged as TConfig);
    fireEvent(this, "config-changed", { config: next });
  }

  protected override render(): TemplateResult {
    if (!this.hass || !this._config) return html``;
    return html`
      <div class="editor" part="editor">
        <ha-form
          .hass=${this.hass}
          .data=${this._config}
          .schema=${this._fullSchema()}
          .computeLabel=${this._computeLabel}
          .computeHelper=${this._computeHelper}
          @value-changed=${this._valueChanged}
        ></ha-form>
      </div>
    `;
  }

  static override styles: CSSResultGroup = [
    morphicBaseTokens,
    css`
      :host {
        display: block;
      }
      .editor {
        display: flex;
        flex-direction: column;
        gap: var(--morphic-gap);
        padding: 4px 2px 8px;
      }
      ha-form {
        display: block;
      }
      /* M3-token accents for the form chrome where HA exposes hooks. */
      .editor {
        --primary-color: var(--morphic-accent, var(--md-sys-color-primary));
        --mdc-theme-primary: var(--morphic-accent, var(--md-sys-color-primary));
      }
    `,
  ];
}

function prettify(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase())
    .trim();
}
