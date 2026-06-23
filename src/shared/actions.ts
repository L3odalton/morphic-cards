// HA-native action handling for Morphic cards.
// Fires `hass-action` events that the Lovelace framework intercepts and handles,
// giving us more-info, toggle, navigate, call-service, url, etc. for free.
//
// Hold detection follows the HA pattern: press starts a timer, if the user
// releases AFTER the threshold the hold action fires on release. If they
// release before, the tap action fires on click.

import { fireEvent } from "./ha";

export interface ActionConfig {
  action: "more-info" | "toggle" | "call-service" | "navigate" | "url" | "none" | "fire-dom-event";
  navigation_path?: string;
  url_path?: string;
  service?: string;
  service_data?: Record<string, unknown>;
  data?: Record<string, unknown>;
  target?: { entity_id?: string | string[] };
  confirmation?: { text?: string; exemptions?: unknown[] };
}

export interface ActionableConfig {
  entity?: string;
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
}

export function fireAction(
  element: HTMLElement,
  config: ActionableConfig,
  action: "tap" | "hold" | "double_tap",
): void {
  fireEvent(element, "hass-action", { config, action });
}

const HOLD_MS = 500;

export function bindActionHandler(
  element: HTMLElement,
  onTap: () => void,
  onHold?: () => void,
  onDoubleTap?: () => void,
): () => void {
  let holdTimer: ReturnType<typeof setTimeout> | undefined;
  let held = false;

  const pointerDown = () => {
    held = false;
    if (onHold) {
      holdTimer = setTimeout(() => {
        held = true;
      }, HOLD_MS);
    }
  };

  const pointerUp = () => {
    clearTimeout(holdTimer);
    if (held) {
      onHold?.();
    }
  };

  const click = () => {
    if (held) {
      held = false;
      return;
    }
    onTap();
  };

  const prevent = (e: Event) => e.preventDefault();

  const dblClick = onDoubleTap
    ? (e: Event) => {
        e.preventDefault();
        onDoubleTap();
      }
    : undefined;

  element.addEventListener("pointerdown", pointerDown);
  element.addEventListener("pointerup", pointerUp);
  element.addEventListener("pointercancel", pointerUp);
  element.addEventListener("contextmenu", prevent);
  element.addEventListener("click", click);
  if (dblClick) element.addEventListener("dblclick", dblClick);

  return () => {
    clearTimeout(holdTimer);
    element.removeEventListener("pointerdown", pointerDown);
    element.removeEventListener("pointerup", pointerUp);
    element.removeEventListener("pointercancel", pointerUp);
    element.removeEventListener("contextmenu", prevent);
    element.removeEventListener("click", click);
    if (dblClick) element.removeEventListener("dblclick", dblClick);
  };
}
