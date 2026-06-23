// Morphic bundle entry point.
// Importing the card/editor modules registers their custom elements as a side
// effect. We also register each card with HA's card picker (window.customCards).

import { MorphicCard } from "./shared/base-card";
import "./editors/trv-editor";
import "./cards/trv-card";
import "./editors/lock-editor";
import "./cards/lock-card";
import "./editors/room-editor";
import "./cards/room-card";
import "./editors/separator-editor";
import "./cards/separator-card";
import "./editors/person-editor";
import "./cards/person-card";

const VERSION = "0.1.0";

MorphicCard.registerCustomCard({
  type: "morphic-trv-card",
  name: "Morphic - TRV Card",
  description:
    "Material 3 Expressive thermostatic radiator valve card with per-card accent, gradient fill, and circle↔squircle icon-morph.",
  documentationURL: "https://github.com/morphic/morphic-cards",
  getEntitySuggestion: (_hass, entityId) => {
    if (!entityId.startsWith("climate.")) return null;
    return { config: { type: "custom:morphic-trv-card", entity: entityId } };
  },
});

MorphicCard.registerCustomCard({
  type: "morphic-person-card",
  name: "Morphic - Person Card",
  description:
    "Material 3 Expressive person card with avatar, zone state, and configurable indicator bubbles.",
  documentationURL: "https://github.com/morphic/morphic-cards",
  getEntitySuggestion: (_hass, entityId) => {
    if (!entityId.startsWith("person.")) return null;
    return { config: { type: "custom:morphic-person-card", entity: entityId } };
  },
});

MorphicCard.registerCustomCard({
  type: "morphic-separator-card",
  name: "Morphic - Separator",
  description: "A simple visual divider line for dashboards.",
  documentationURL: "https://github.com/morphic/morphic-cards",
});

MorphicCard.registerCustomCard({
  type: "morphic-room-card",
  name: "Morphic - Room Card",
  description:
    "Navigable room tile with status chips, climate readouts, and tap-to-navigate.",
  documentationURL: "https://github.com/morphic/morphic-cards",
});

MorphicCard.registerCustomCard({
  type: "morphic-lock-card",
  name: "Morphic - Lock Card",
  description:
    "Compact lock card with optional inline confirmation overlay, status chips, and full action support.",
  documentationURL: "https://github.com/morphic/morphic-cards",
  getEntitySuggestion: (_hass, entityId) => {
    if (!entityId.startsWith("lock.")) return null;
    return { config: { type: "custom:morphic-lock-card", entity: entityId } };
  },
});

// Friendly console banner so users can confirm the bundle loaded.
const style = "color:#fff;background:#6750a4;padding:2px 8px;border-radius:8px;font-weight:600";
console.info(`%cMorphic ${VERSION}`, style, "Material 3 Expressive cards loaded");
