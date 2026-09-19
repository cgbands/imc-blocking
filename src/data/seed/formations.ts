import type { PersonPlacement, PositionZone, StageConfig } from "../../types";

interface FormationOptions {
  /** how many of the given member ids to tuck into the wings instead of the main formation */
  wingsCount?: number;
}

function wingPlacements(ids: string[], stage: StageConfig): PersonPlacement[] {
  return ids.map((memberId, i) => {
    const side: PositionZone = i % 2 === 0 ? "wings-left" : "wings-right";
    const laneIndex = Math.floor(i / 2);
    const x = side === "wings-left" ? -4 - (laneIndex % 3) * 2 : stage.width + 4 + (laneIndex % 3) * 2;
    const y = 6 + laneIndex * 3;
    return { memberId, x, y, zone: side };
  });
}

function splitWings(ids: string[], opts: FormationOptions | undefined) {
  const wingsCount = Math.min(opts?.wingsCount ?? 0, ids.length);
  return {
    wingIds: ids.slice(0, wingsCount),
    mainIds: ids.slice(wingsCount),
  };
}

/** Rows on the risers (aligned to the actual riser grid) plus floor rows in front of them. */
export function formationRiserRows(ids: string[], stage: StageConfig, opts?: FormationOptions): PersonPlacement[] {
  const { wingIds, mainIds } = splitWings(ids, opts);

  const riserRowYs = Array.from(new Set(stage.risers.map((r) => r.y + r.height / 2))).sort((a, b) => a - b);
  const riserMinX = Math.min(...stage.risers.map((r) => r.x));
  const riserMaxX = Math.max(...stage.risers.map((r) => r.x + r.width));

  const rows = [
    ...riserRowYs.map((y) => ({ y, minX: riserMinX + 0.6, maxX: riserMaxX - 0.6 })),
    { y: stage.height - 6, minX: 4, maxX: stage.width - 4 },
    { y: stage.height - 2, minX: 4, maxX: stage.width - 4 },
  ];
  const perRow = Math.ceil(mainIds.length / rows.length);
  const placements: PersonPlacement[] = [];
  let cursor = 0;
  rows.forEach(({ y, minX, maxX }) => {
    const rowIds = mainIds.slice(cursor, cursor + perRow);
    cursor += perRow;
    rowIds.forEach((memberId, i) => {
      const x = rowIds.length === 1 ? (minX + maxX) / 2 : minX + ((maxX - minX) * i) / (rowIds.length - 1);
      placements.push({ memberId, x, y, zone: "stage" });
    });
  });
  return [...placements, ...wingPlacements(wingIds, stage)];
}

/** A V / wedge with the point toward the audience (front-center). */
export function formationWedge(ids: string[], stage: StageConfig, opts?: FormationOptions): PersonPlacement[] {
  const { wingIds, mainIds } = splitWings(ids, opts);
  const apex = { x: stage.width / 2, y: stage.height - 3 };
  const rows = 8;
  const perRow = Math.ceil(mainIds.length / rows);
  const placements: PersonPlacement[] = [];
  let cursor = 0;
  for (let row = 0; row < rows; row++) {
    const rowIds = mainIds.slice(cursor, cursor + perRow);
    cursor += perRow;
    const depth = row * ((stage.height - 6) / rows);
    const spread = 2 + row * 3.4;
    rowIds.forEach((memberId, i) => {
      const t = rowIds.length === 1 ? 0 : i / (rowIds.length - 1) - 0.5;
      placements.push({ memberId, x: apex.x + t * spread * 2, y: apex.y - depth, zone: "stage" });
    });
  }
  return [...placements, ...wingPlacements(wingIds, stage)];
}

/** A single large circle, center stage. */
export function formationCircle(ids: string[], stage: StageConfig, opts?: FormationOptions): PersonPlacement[] {
  const { wingIds, mainIds } = splitWings(ids, opts);
  const cx = stage.width / 2;
  const cy = stage.height / 2 + 2;
  const radius = Math.min(stage.width, stage.height) * 0.4;
  const placements = mainIds.map((memberId, i) => {
    const angle = (i / mainIds.length) * Math.PI * 2;
    return {
      memberId,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * 0.7 * Math.sin(angle),
      zone: "stage" as const,
    };
  });
  return [...placements, ...wingPlacements(wingIds, stage)];
}

/** A loose, deterministic "scatter" across the stage. */
export function formationScatter(ids: string[], stage: StageConfig, rng: () => number, opts?: FormationOptions): PersonPlacement[] {
  const { wingIds, mainIds } = splitWings(ids, opts);
  const cols = Math.ceil(Math.sqrt(mainIds.length * (stage.width / stage.height)));
  const rowsCount = Math.ceil(mainIds.length / cols);
  const cellW = stage.width / cols;
  const cellH = (stage.height - 4) / rowsCount;
  const placements = mainIds.map((memberId, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const jitterX = (rng() - 0.5) * cellW * 0.6;
    const jitterY = (rng() - 0.5) * cellH * 0.6;
    return {
      memberId,
      x: cellW * (col + 0.5) + jitterX,
      y: 2 + cellH * (row + 0.5) + jitterY,
      zone: "stage" as const,
    };
  });
  return [...placements, ...wingPlacements(wingIds, stage)];
}

/** A shallow crescent, bowed toward the audience. */
export function formationArc(ids: string[], stage: StageConfig, opts?: FormationOptions): PersonPlacement[] {
  const { wingIds, mainIds } = splitWings(ids, opts);
  const cx = stage.width / 2;
  const baseY = stage.height - 8;
  const radius = stage.width * 0.62;
  const spreadAngle = Math.PI * 0.55;
  const placements = mainIds.map((memberId, i) => {
    const t = mainIds.length === 1 ? 0.5 : i / (mainIds.length - 1);
    const angle = Math.PI / 2 - spreadAngle / 2 + t * spreadAngle;
    return {
      memberId,
      x: cx + radius * Math.cos(angle),
      y: baseY - radius * Math.sin(angle) + radius * 0.5,
      zone: "stage" as const,
    };
  });
  return [...placements, ...wingPlacements(wingIds, stage)];
}

/** Two blocks split by a center aisle. */
export function formationBlocks(ids: string[], stage: StageConfig, opts?: FormationOptions): PersonPlacement[] {
  const { wingIds, mainIds } = splitWings(ids, opts);
  const half = Math.ceil(mainIds.length / 2);
  const left = mainIds.slice(0, half);
  const right = mainIds.slice(half);
  const placeBlock = (blockIds: string[], side: "left" | "right"): PersonPlacement[] => {
    const cols = Math.ceil(Math.sqrt(blockIds.length));
    const rowsCount = Math.ceil(blockIds.length / cols);
    const blockWidth = stage.width * 0.38;
    const startX = side === "left" ? stage.width * 0.08 : stage.width * 0.54;
    return blockIds.map((memberId, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      return {
        memberId,
        x: startX + (blockWidth * (col + 0.5)) / cols,
        y: 6 + (row * (stage.height - 10)) / rowsCount,
        zone: "stage" as const,
      };
    });
  };
  return [...placeBlock(left, "left"), ...placeBlock(right, "right"), ...wingPlacements(wingIds, stage)];
}
