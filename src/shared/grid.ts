// CORE FEATURE 4 helpers: sections-first grid options.
// HA's Sections view calls getGridOptions() on a card to size it in the grid.

import type { LovelaceGridOptions } from "./ha";

export type MorphicGridOptions = LovelaceGridOptions;

export const DEFAULT_GRID_OPTIONS: MorphicGridOptions = {
  columns: 6,
  rows: 3,
  min_columns: 4,
  min_rows: 2,
};

/** Merge a card's preferred grid options over the shared defaults. */
export function mergeGridOptions(overrides: Partial<MorphicGridOptions>): MorphicGridOptions {
  return { ...DEFAULT_GRID_OPTIONS, ...overrides };
}
