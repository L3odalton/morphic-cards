// Morphic Separator Card — a simple visual divider for dashboards.

import { html, css, type TemplateResult, type CSSResultGroup } from "lit";
import { customElement } from "lit/decorators.js";

import { MorphicCard, type MorphicBaseConfig } from "../shared/base-card";
import type { MorphicGridOptions } from "../shared/grid";
import type { HomeAssistant } from "../shared/ha";

export interface SeparatorCardConfig extends MorphicBaseConfig {
  style?: "solid" | "dashed" | "dotted";
  thickness?: number;
}

@customElement("morphic-separator-card")
export class MorphicSeparatorCard extends MorphicCard<SeparatorCardConfig> {
  static getConfigElement(): HTMLElement {
    return document.createElement("morphic-separator-card-editor");
  }

  static getStubConfig(_hass: HomeAssistant): SeparatorCardConfig {
    return { type: "custom:morphic-separator-card" };
  }

  public override getGridOptions(): MorphicGridOptions {
    return { columns: 12, rows: "auto", min_columns: 2, min_rows: 1 };
  }

  public override getCardSize(): number {
    return 1;
  }

  protected renderContent(): TemplateResult {
    const thickness = this._config?.thickness ?? 3;
    return html`
      <div class="line" style="block-size: ${thickness}px"></div>
    `;
  }

  static override styles: CSSResultGroup = [
    MorphicCard.styles as CSSResultGroup,
    css`
      .morphic-root {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 4px 0;
        background: none;
        border: none;
        background-image: none;
        box-shadow: none;
        block-size: auto;
      }
      .line {
        inline-size: 48%;
        border-radius: 999px;
        background: var(--morphic-accent);
        opacity: 0.55;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "morphic-separator-card": MorphicSeparatorCard;
  }
}
