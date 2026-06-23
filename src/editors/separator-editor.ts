// GUI editor for the Morphic Separator Card.

import { customElement } from "lit/decorators.js";

import { MorphicEditorBase, type HaFormSchema } from "./base-editor";
import type { SeparatorCardConfig } from "../cards/separator-card";

@customElement("morphic-separator-card-editor")
export class MorphicSeparatorCardEditor extends MorphicEditorBase<SeparatorCardConfig> {
  protected override schema(): HaFormSchema[] {
    return [
      {
        name: "thickness",
        selector: { number: { min: 1, max: 4, step: 1, mode: "box" } },
      },
    ];
  }

  protected override labels(): Record<string, string> {
    return {
      thickness: "Thickness (px)",
    };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "morphic-separator-card-editor": MorphicSeparatorCardEditor;
  }
}
