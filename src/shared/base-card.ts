// MorphicCard — the shared base class every Morphic card extends.
// It bakes in the core features so individual cards just render content:
//   Feature 1: theme-derived per-card accent engine
//   Feature 2: subtle accent -> primary gradient fill (token)
//   Feature 3: circle <-> squircle icon-morph (via shapes.ts, used by cards)
//   Feature 4: sections-first responsive layout (getGridOptions + container query)

import { LitElement, html, css, type PropertyValues, type TemplateResult, type CSSResultGroup } from "lit";
import { property, state } from "lit/decorators.js";

import type { CustomCardEntry, HomeAssistant, LovelaceCardConfig } from "./ha";
import {
  type AccentTokens,
  deriveAccentTokens,
  generateHarmonizedPalette,
  type PaletteOptions,
  selectSeed,
} from "./accent-engine";
import { readThemeContext } from "./theme";
import { applyAccentTokens, morphicBaseTokens, setFlatFill, TOKENS } from "./tokens";
import { DEFAULT_GRID_OPTIONS, type MorphicGridOptions } from "./grid";

export interface MorphicBaseConfig extends LovelaceCardConfig {
  name?: string;
  title?: string;
  entity?: string;
  /** Explicit accent override: hex/rgb literal, palette index, or "accent-N". */
  color?: string | number;
  /** Stable color key; overrides title/entity for accent selection. */
  color_key?: string;
  /** Force explicit palette seeds (hex/rgb). */
  palette?: string[];
  /** Harmonize seeds toward the theme source (default true). */
  harmonize?: boolean;
  /** Number of generated accent seeds (8–12). */
  palette_size?: number;
  /** Render the accent fill as a flat tint instead of a gradient. */
  flat_fill?: boolean;
  /** Override the subtle fill intensity (0–1). */
  accent_intensity?: number;
}

export abstract class MorphicCard<
  TConfig extends MorphicBaseConfig = MorphicBaseConfig,
> extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() protected _config?: TConfig;

  /** Last derived accent token set; available to subclass templates/logic. */
  protected accent?: AccentTokens;

  private _accentSignature = "";
  private _resizeObserver?: ResizeObserver;

  static override styles: CSSResultGroup = [
    morphicBaseTokens,
    css`
      :host {
        display: block;
        block-size: 100%;
      }
      .morphic-root {
        container-type: inline-size;
        container-name: morphic;
        box-sizing: border-box;
        block-size: 100%;
        border-radius: var(--morphic-radius);
        background-color: var(--morphic-surface);
        background-image: var(--morphic-accent-fill);
        color: var(--morphic-on-surface);
        overflow: clip;
        border: 1px solid var(--morphic-outline);
      }
    `,
  ];

  // ---- Lovelace config lifecycle -------------------------------------------

  public setConfig(config: TConfig): void {
    if (!config) throw new Error("Invalid configuration");
    this._config = { ...config };
    this.validateConfig(this._config);
  }

  /** Subclasses may override to validate required fields. */
  protected validateConfig(_config: TConfig): void {
    /* no-op by default */
  }

  // ---- Sections-first grid (Feature 4) -------------------------------------

  public getGridOptions(): MorphicGridOptions {
    return { ...DEFAULT_GRID_OPTIONS };
  }

  public getCardSize(): number {
    return 3;
  }

  // ---- Accent selection inputs (Feature 1) ---------------------------------

  /** Friendly name of the bound entity, if any. */
  protected get entityFriendlyName(): string | undefined {
    const id = this._config?.entity;
    if (!id || !this.hass) return undefined;
    return this.hass.states[id]?.attributes.friendly_name ?? id;
  }

  /**
   * Stable color key. Precedence (when no explicit `color:`):
   *   color_key > title/name > entity friendly name > entity_id > card type.
   */
  protected resolveColorKey(): string {
    const c = this._config;
    return (
      c?.color_key ||
      c?.title ||
      c?.name ||
      this.entityFriendlyName ||
      c?.entity ||
      c?.type ||
      "morphic"
    );
  }

  private paletteOptions(): PaletteOptions {
    const c = this._config;
    return {
      count: c?.palette_size ?? 10,
      harmonize: c?.harmonize ?? true,
      explicit: c?.palette,
    };
  }

  // ---- Lifecycle -----------------------------------------------------------

  override connectedCallback(): void {
    super.connectedCallback();
    this._observeResize();
    // Recompute when the user toggles theme/dark mode at runtime.
    this._applyAccent();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._resizeObserver?.disconnect();
    this._resizeObserver = undefined;
  }

  protected override willUpdate(changed: PropertyValues): void {
    if (changed.has("hass") || changed.has("_config")) {
      this._applyAccent();
    }
  }

  protected override firstUpdated(): void {
    this._observeResize();
  }

  private _observeResize(): void {
    if (this._resizeObserver || typeof ResizeObserver === "undefined") return;
    this._resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        const wBucket = w < 220 ? "compact" : w < 360 ? "regular" : "wide";
        const hBucket = h < 80 ? "compact" : h < 140 ? "medium" : h < 220 ? "tall" : "x-tall";
        if (this.getAttribute("data-size") !== wBucket) {
          this.setAttribute("data-size", wBucket);
        }
        if (this.getAttribute("data-height") !== hBucket) {
          this.setAttribute("data-height", hBucket);
        }
      }
    });
    this._resizeObserver.observe(this);
  }

  /** Feature 1 + 2: derive and apply the per-card accent tokens. */
  private _applyAccent(): void {
    if (!this.isConnected || !this._config) return;
    const { source, isDark } = readThemeContext(this, this.hass);
    const colorKey = this.resolveColorKey();
    const opts = this.paletteOptions();

    const signature = JSON.stringify([
      source,
      isDark,
      colorKey,
      this._config.color ?? null,
      opts.count,
      opts.harmonize,
      opts.explicit ?? null,
    ]);
    if (signature === this._accentSignature) return;
    this._accentSignature = signature;

    const palette = generateHarmonizedPalette(source, opts);
    const seed = selectSeed(palette, colorKey, this._config.color);
    this.accent = deriveAccentTokens(seed, isDark);
    applyAccentTokens(this, this.accent);

    const intensity =
      typeof this._config.accent_intensity === "number"
        ? this._config.accent_intensity
        : isDark
          ? 0.14
          : 0.04;
    this.style.setProperty(TOKENS.accentFillIntensity, String(intensity));
    setFlatFill(this, Boolean(this._config.flat_fill));
  }

  // ---- Render --------------------------------------------------------------

  protected abstract renderContent(): TemplateResult;

  protected override render(): TemplateResult {
    if (!this._config) return html``;
    return html`<div class="morphic-root" part="root">${this.renderContent()}</div>`;
  }

  // ---- Registration helper -------------------------------------------------

  static registerCustomCard(entry: CustomCardEntry): void {
    const list = (window.customCards = window.customCards || []);
    if (!list.find((c) => c.type === entry.type)) {
      list.push({ preview: true, ...entry });
    }
  }
}
