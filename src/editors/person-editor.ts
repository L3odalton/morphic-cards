// GUI editor for the Morphic Person Card.

import { customElement } from "lit/decorators.js";

import { MorphicEditorBase, type HaFormSchema } from "./base-editor";
import type { PersonCardConfig } from "../cards/person-card";

@customElement("morphic-person-card-editor")
export class MorphicPersonCardEditor extends MorphicEditorBase<PersonCardConfig> {
  protected override schema(): HaFormSchema[] {
    return [
      { name: "entity", required: true, selector: { entity: { domain: "person" } } },
      { name: "name", selector: { text: {} } },
      {
        type: "expandable",
        name: "",
        title: "Bubbles",
        icon: "mdi:circle-double",
        expanded: true,
        schema: [
          {
            name: "bubble_1_entity",
            selector: { entity: {} },
          },
          {
            name: "bubble_1_position",
            selector: {
              select: {
                mode: "dropdown",
                options: [
                  { value: "0", label: "Top (0°)" },
                  { value: "45", label: "Top-right (45°)" },
                  { value: "90", label: "Right (90°)" },
                  { value: "135", label: "Bottom-right (135°)" },
                  { value: "180", label: "Bottom (180°)" },
                  { value: "225", label: "Bottom-left (225°)" },
                  { value: "270", label: "Left (270°)" },
                  { value: "315", label: "Top-left (315°)" },
                ],
              },
            },
          },
          { name: "bubble_1_icon", selector: { icon: {} } },
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
      bubble_1_entity: "Bubble entity (leave empty for person zone)",
      bubble_1_position: "Bubble position",
      bubble_1_icon: "Bubble icon (auto from state if empty)",
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
        "Entity whose state drives the bubble icon and color. Defaults to the person's zone.",
      bubble_1_position:
        "Clock position around the icon where the bubble appears.",
      color:
        "Force an accent: hex (#3b82f6), rgb(), a palette index (3) or name (accent-3). Leave empty to derive from the color key.",
    };
  }

  protected override withDefaults(config: PersonCardConfig): PersonCardConfig {
    const out = { ...config };
    // Translate flat bubble_1_* fields into the bubbles array for the card.
    const raw = out as Record<string, unknown>;
    if (raw.bubble_1_position !== undefined || raw.bubble_1_entity !== undefined || raw.bubble_1_icon !== undefined) {
      const pos = Number(raw.bubble_1_position ?? 45) as PersonCardConfig["bubbles"] extends (infer B)[] ? B extends { position: infer P } ? P : never : never;
      out.bubbles = [
        {
          position: (pos || 45) as 0 | 45 | 90 | 135 | 180 | 225 | 270 | 315,
          entity: (raw.bubble_1_entity as string) || undefined,
          icon: (raw.bubble_1_icon as string) || undefined,
        },
      ];
    }
    return out;
  }

  public override setConfig(config: PersonCardConfig): void {
    // Hydrate flat bubble_1_* fields from the bubbles array for the editor form.
    const flat: Record<string, unknown> = { ...config };
    const b = config.bubbles?.[0];
    if (b) {
      flat.bubble_1_position = String(b.position ?? 45);
      flat.bubble_1_entity = b.entity ?? "";
      flat.bubble_1_icon = b.icon ?? "";
    }
    super.setConfig(flat as PersonCardConfig);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "morphic-person-card-editor": MorphicPersonCardEditor;
  }
}
