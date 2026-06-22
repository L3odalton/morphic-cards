// Minimal Home Assistant + Lovelace typings and helpers.
// We intentionally avoid a heavy external dependency so the bundle stays small
// and we keep full control of the surface we rely on.

export interface HassEntityAttributeBase {
  friendly_name?: string;
  icon?: string;
  device_class?: string;
  unit_of_measurement?: string;
  supported_features?: number;
  assumed_state?: boolean;
  [key: string]: unknown;
}

export interface HassEntity {
  entity_id: string;
  state: string;
  last_changed: string;
  last_updated: string;
  attributes: HassEntityAttributeBase;
  context: { id: string; user_id: string | null; parent_id: string | null };
}

export interface ThemeSettings {
  theme: string;
  dark?: boolean;
  primaryColor?: string;
  accentColor?: string;
}

export interface HomeAssistant {
  states: Record<string, HassEntity>;
  themes: {
    darkMode: boolean;
    theme: string;
    themes: Record<string, Record<string, string>>;
  };
  selectedTheme?: ThemeSettings | null;
  language: string;
  locale: {
    language: string;
    number_format?: string;
    time_format?: string;
  };
  config: {
    unit_system: { temperature: string; length: string; mass: string; volume: string };
    [key: string]: unknown;
  };
  callService(
    domain: string,
    service: string,
    serviceData?: Record<string, unknown>,
    target?: { entity_id?: string | string[] },
  ): Promise<unknown>;
  localize(key: string, ...args: unknown[]): string;
  formatEntityState?(stateObj: HassEntity, state?: string): string;
  formatEntityAttributeValue?(stateObj: HassEntity, attribute: string): string;
}

export interface LovelaceCardConfig {
  type: string;
  [key: string]: unknown;
}

/** HA Sections grid options returned by a card's getGridOptions(). */
export interface LovelaceGridOptions {
  columns?: number | "full";
  rows?: number | "auto";
  min_columns?: number;
  min_rows?: number;
  max_columns?: number;
  max_rows?: number;
}

export interface LovelaceCard extends HTMLElement {
  hass?: HomeAssistant;
  setConfig(config: LovelaceCardConfig): void;
  getCardSize(): number | Promise<number>;
  getGridOptions?(): LovelaceGridOptions;
}

export interface LovelaceCardEditor extends HTMLElement {
  hass?: HomeAssistant;
  setConfig(config: LovelaceCardConfig): void;
}

export interface CustomCardEntry {
  type: string;
  name: string;
  description?: string;
  preview?: boolean;
  documentationURL?: string;
}

declare global {
  interface Window {
    customCards?: CustomCardEntry[];
  }
}

/** Fire a DOM CustomEvent that bubbles + composes (the HA convention). */
export function fireEvent<T>(
  node: HTMLElement | Window,
  type: string,
  detail?: T,
  options?: { bubbles?: boolean; cancelable?: boolean; composed?: boolean },
): void {
  const event = new CustomEvent(type, {
    detail,
    bubbles: options?.bubbles ?? true,
    cancelable: options?.cancelable ?? false,
    composed: options?.composed ?? true,
  });
  node.dispatchEvent(event);
}

/** Whether HA reports an entity as unavailable/unknown. */
export function isUnavailable(stateObj?: HassEntity): boolean {
  return !stateObj || stateObj.state === "unavailable" || stateObj.state === "unknown";
}
