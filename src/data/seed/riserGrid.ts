import type { Riser, RiserEdge, RiserGridConfig } from "../../types";

/** Expands a RiserGridConfig into individual Riser blocks, row by row (row 0 = furthest upstage). */
export function buildRiserGrid(config: RiserGridConfig): Riser[] {
  const risers: Riser[] = [];
  for (let row = 0; row < config.rows; row++) {
    for (let col = 0; col < config.cols; col++) {
      const stairEdges: RiserEdge[] = ["front"];
      if (col === 0) stairEdges.push("left");
      if (col === config.cols - 1) stairEdges.push("right");
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

export function riserGridBounds(config: RiserGridConfig) {
  const width = config.cols * config.riserWidth + (config.cols - 1) * config.gapX;
  const height = config.rows * config.riserHeight + (config.rows - 1) * config.gapY;
  return {
    minX: config.originX,
    maxX: config.originX + width,
    minY: config.originY,
    maxY: config.originY + height,
    width,
    height,
  };
}
