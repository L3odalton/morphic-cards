// GUI editor for the Morphic Person Card.

import { customElement } from "lit/decorators.js";

import { MorphicEditorBase, type HaFormSchema } from "./base-editor";
import type { PersonCardConfig, BubbleConfig, BubbleStateConfig } from "../cards/person-card";

@customElement("morphic-person-card-editor")
export class MorphicPersonCardEditor extends MorphicEditorBase<PersonCardConfig> {
  protected override schema(): HaFormSchema[] {
    return [
      { name: "entity", required: true, selector: { entity: { domain: "person" } } },
      { name: "name", selector: { text: {} } },
      { name: "show_zone", selector: { boolean: {} } },
      {
        type: "expandable",
        name: "",
        title: "Bubble indicator",
        icon: "mdi:circle-double",
        expanded: true,
        schema: [
          {
            name: "bubble_1_entity",
            selector: { entity: {} },
          },
          {
            name: "bubble_1_states",
            selector: {
              text: { multiline: false },
            },
          },
          {
            name: "bubble_1_color",
            selector: { text: {} },
          },
        ],
      },
      {
        type: "expandable",
        name: "",
        title: "Icon actions",
        icon: "mdi:gesture-tap",
        schema: [
          { name: "tap_action", selector: { ui_action: {} } },
          { name: "hold_action", selector: { ui_action: {} } },
          { name: "double_tap_action", selector: { ui_action: {} } },
        ],
      },
      {
        type: "expandable",
        name: "",
        title: "Appearance & accent",
        icon: "mdi:palette",
        schema: [
          { name: "icon", selector: { icon: {} } },
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
    ];
  }

  protected override labels(): Record<string, string> {
    return {
      entity: "Person entity",
      name: "Name (overrides friendly name)",
      show_zone: "Show zone label",
      bubble_1_entity: "Bubble entity (leave empty for person zone)",
      bubble_1_states: "Show when state is (comma-separated)",
      bubble_1_color: "Color override (auto from state if empty)",
      tap_action: "Tap action",
      hold_action: "Hold action",
      double_tap_action: "Double-tap action",
      icon: "Icon (defaults to entity icon / avatar)",
      color: "Accent override",
      color_key: "Color key",
      harmonize: "Harmonize to theme",
      flat_fill: "Flat fill (no gradient)",
      accent_intensity: "Accent fill intensity",
    };
  }

  protected override helpers(): Record<string, string> {
    return {
      bubble_1_entity:
        "Entity whose state drives visibility. Defaults to the person's zone.",
      bubble_1_states:
        'States that make the bubble visible, e.g. "home" or "home, away, work". Each state can have its own icon/color via YAML.',
      bubble_1_color:
        "CSS color or token, e.g. var(--morphic-accent), #4caf50. Applied when no per-state color matches.",
      color:
        "Force an accent: hex (#3b82f6), rgb(), a palette index (3) or name (accent-3). Leave empty to derive from the color key.",
    };
  }

  protected override withDefaults(config: PersonCardConfig): PersonCardConfig {
    const out = { ...config };
    const raw = out as Record<string, unknown>;
    const statesStr = (raw.bubble_1_states as string) ?? "";
    const states = statesStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (states.length > 0) {
      const defaultColor = (raw.bubble_1_color as string) || undefined;
      const pos = Number(raw.bubble_1_position ?? 45) as BubbleConfig["position"];

      const conditions: BubbleStateConfig[] = states.map((state) => ({
        state,
        color: defaultColor,
      }));

      out.bubbles = [
        {
          position: (pos || 45) as BubbleConfig["position"],
          entity: (raw.bubble_1_entity as string) || undefined,
          conditions,
        },
      ];
    } else {
      out.bubbles = [];
    }
    return out;
  }

  public override setConfig(config: PersonCardConfig): void {
    const flat: Record<string, unknown> = { ...config };
    const b = config.bubbles?.[0];
    if (b) {
      flat.bubble_1_position = String(b.position ?? 45);
      flat.bubble_1_entity = b.entity ?? "";
      flat.bubble_1_states = b.conditions?.map((c) => c.state).join(", ") ?? "";
      flat.bubble_1_color = b.conditions?.[0]?.color ?? "";
    }
    super.setConfig(flat as PersonCardConfig);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "morphic-person-card-editor": MorphicPersonCardEditor;
  }
}
