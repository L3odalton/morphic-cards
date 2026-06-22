// GUI editor for the Morphic TRV card. Built on the shared M3 editor base.
// Grouped/collapsible sections, sane defaults, helper text. HA renders the
// live preview automatically alongside this form.

import { customElement } from "lit/decorators.js";

import { MorphicEditorBase, type HaFormSchema } from "./base-editor";
import type { TrvCardConfig } from "../cards/trv-card";

@customElement("morphic-trv-card-editor")
export class MorphicTrvCardEditor extends MorphicEditorBase<TrvCardConfig> {
  protected override schema(): HaFormSchema[] {
    return [
      { name: "entity", required: true, selector: { entity: { domain: "climate" } } },
      { name: "name", selector: { text: {} } },
      {
        type: "expandable",
        name: "controls",
        title: "Controls",
        icon: "mdi:thermometer",
        expanded: true,
        schema: [
          {
            type: "grid",
            name: "",
            schema: [
              { name: "show_hvac_modes", selector: { boolean: {} } },
              { name: "show_presets", selector: { boolean: {} } },
            ],
          },
          {
            name: "step",
            selector: {
              number: { min: 0.5, max: 5, step: 0.5, mode: "box", unit_of_measurement: "°" },
            },
          },
        ],
      },
      {
        type: "expandable",
        name: "extras",
        title: "Extra readouts",
        icon: "mdi:gauge",
        schema: [
          {
            type: "grid",
            name: "",
            schema: [
              { name: "show_valve_position", selector: { boolean: {} } },
              { name: "show_battery", selector: { boolean: {} } },
              { name: "show_window", selector: { boolean: {} } },
            ],
          },
          { name: "valve_position_entity", selector: { entity: { domain: "sensor" } } },
          {
            name: "battery_entity",
            selector: { entity: { filter: [{ domain: "sensor", device_class: "battery" }] } },
          },
          {
            name: "window_entity",
            selector: { entity: { domain: ["binary_sensor", "sensor"] } },
          },
        ],
      },
      {
        type: "expandable",
        name: "appearance",
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
          {
            name: "palette_size",
            selector: { number: { min: 4, max: 16, step: 1, mode: "box" } },
          },
        ],
      },
    ];
  }

  protected override labels(): Record<string, string> {
    return {
      entity: "Thermostat / TRV entity",
      name: "Name (overrides friendly name)",
      controls: "Controls",
      show_hvac_modes: "Show HVAC modes",
      show_presets: "Show presets",
      step: "Temperature step",
      extras: "Extra readouts",
      show_valve_position: "Valve position",
      show_battery: "Battery",
      show_window: "Window / heating",
      valve_position_entity: "Valve position entity",
      battery_entity: "Battery entity",
      window_entity: "Window / contact entity",
      appearance: "Appearance & accent",
      color: "Accent override",
      color_key: "Color key",
      harmonize: "Harmonize to theme",
      flat_fill: "Flat fill (no gradient)",
      accent_intensity: "Accent fill intensity",
      palette_size: "Palette size",
    };
  }

  protected override helpers(): Record<string, string> {
    return {
      color:
        "Force an accent: hex (#3b82f6), rgb(), a palette index (3) or name (accent-3). Leave empty to derive from the color key.",
      color_key:
        "Stable key used to pick a harmonized accent. Defaults to the card title, then the entity.",
      step: "Defaults to the device's target_temp_step, or 0.5°.",
      accent_intensity: "How strong the accent → primary gradient appears (subtle by default).",
      harmonize: "Blend generated seeds toward your theme's primary for cohesion.",
    };
  }

  protected override withDefaults(config: TrvCardConfig): TrvCardConfig {
    return { ...config };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "morphic-trv-card-editor": MorphicTrvCardEditor;
  }
}
