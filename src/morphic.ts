// Morphic bundle entry point.
// Importing the card/editor modules registers their custom elements as a side
// effect. We also register each card with HA's card picker (window.customCards).

import { MorphicCard } from "./shared/base-card";
import "./editors/trv-editor";
import "./cards/trv-card";
import "./editors/person-editor";
import "./cards/person-card";

const VERSION = "0.1.0";

MorphicCard.registerCustomCard({
  type: "morphic-trv-card",
  name: "Morphic TRV Card",
  description:
    "Material 3 Expressive thermostatic radiator valve card with per-card accent, gradient fill, and circle↔squircle icon-morph.",
  documentationURL: "https://github.com/morphic/morphic-cards",
});

MorphicCard.registerCustomCard({
  type: "morphic-person-card",
  name: "Morphic Person Card",
  description:
    "Material 3 Expressive person card with avatar, zone state, and configurable indicator bubbles.",
  documentationURL: "https://github.com/morphic/morphic-cards",
});

// Friendly console banner so users can confirm the bundle loaded.
const style = "color:#fff;background:#6750a4;padding:2px 8px;border-radius:8px;font-weight:600";
console.info(`%cMorphic ${VERSION}`, style, "Material 3 Expressive cards loaded");
