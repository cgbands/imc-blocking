import type { Riser, RiserEdge, RiserGridConfig } from "../../types";

/** Expands a RiserGridConfig into individual Riser blocks, row by row (row 0 = furthest upstage). */
export function buildRiserGrid(config: RiserGridConfig): Riser[] {
  const risers: Riser[] = [];
  const stairs = config.stairs ?? { front: true, back: false, left: false, right: false };
  for (let row = 0; row < config.rows; row++) {
    for (let col = 0; col < config.cols; col++) {
      // Stairs live on the perimeter of the grid, on whichever edges are enabled.
      const stairEdges: RiserEdge[] = [];
      if (stairs.front && row === config.rows - 1) stairEdges.push("front");
      if (stairs.back && row === 0) stairEdges.push("back");
      if (stairs.left && col === 0) stairEdges.push("left");
      if (stairs.right && col === config.cols - 1) stairEdges.push("right");
      risers.push({
        id: `riser-r${row + 1}c${col + 1}`,
        x: config.originX + col * (config.riserWidth + config.gapX),
        y: config.originY + row * (config.riserHeight + config.gapY),
        width: config.riserWidth,
        height: config.riserHeight,
        stairEdges,
      });
    }
  }
  return risers;
}

export function riserGridSize(config: RiserGridConfig) {
  return {
    width: config.cols * config.riserWidth + (config.cols - 1) * config.gapX,
    height: config.rows * config.riserHeight + (config.rows - 1) * config.gapY,
  };
}

/** Re-centers the grid horizontally on a stage of the given width. */
export function centeredOriginX(config: RiserGridConfig, stageWidth: number): number {
  return (stageWidth - riserGridSize(config).width) / 2;
}
