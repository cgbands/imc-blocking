import { useState } from "react";
import type { RiserEdge, RiserGridConfig, StageConfig } from "../../types";
import { buildRiserGrid, centeredOriginX } from "../../data/seed/riserGrid";
import styles from "./editor.module.css";

interface StageSetupPanelProps {
  stageConfig: StageConfig;
  onChange: (config: StageConfig) => void;
}

const GRID_OPTIONS: StageConfig["gridSpacingFt"][] = [0, 1, 2, 5];
const STAIR_EDGES: RiserEdge[] = ["front", "back", "left", "right"];

/** Quick-start layouts, sized to whatever the current stage width is. */
function presetRiserGrid(rows: number, cols: number, stageWidth: number, stairs: RiserGridConfig["stairs"]): RiserGridConfig {
  if (rows === 0 || cols === 0) {
    return { rows: 0, cols: 0, riserWidth: 1, riserHeight: 1, gapX: 1, gapY: 1, originX: 0, originY: 2, stairs };
  }
  const gapX = 1.2;
  const gapY = 1.1;
  const riserWidth = Math.max(3, (stageWidth * 0.72 - (cols - 1) * gapX) / cols);
  const grid: RiserGridConfig = { rows, cols, riserWidth, riserHeight: 3.2, gapX, gapY, originX: 0, originY: 2, stairs };
  grid.originX = centeredOriginX(grid, stageWidth);
  return grid;
}

const PRESETS: { label: string; rows: number; cols: number }[] = [
  { label: "No risers", rows: 0, cols: 0 },
  { label: "3 × 3", rows: 3, cols: 3 },
  { label: "5 × 5", rows: 5, cols: 5 },
  { label: "6 × 6", rows: 6, cols: 6 },
];

export function StageSetupPanel({ stageConfig, onChange }: StageSetupPanelProps) {
  const [open, setOpen] = useState(false);
  const grid = stageConfig.riserGrid;

  /** Any riser-grid change regenerates the individual riser blocks. */
  const patchGrid = (patch: Partial<typeof grid>) => {
    const nextGrid = { ...grid, ...patch };
    nextGrid.originX = centeredOriginX(nextGrid, stageConfig.width);
    onChange({ ...stageConfig, riserGrid: nextGrid, risers: buildRiserGrid(nextGrid) });
  };

  const patchStage = (patch: Partial<StageConfig>) => {
    const next = { ...stageConfig, ...patch };
    if (patch.width != null) {
      const nextGrid = { ...next.riserGrid, originX: centeredOriginX(next.riserGrid, patch.width) };
      next.riserGrid = nextGrid;
      next.risers = buildRiserGrid(nextGrid);
      next.wings = next.wings.map((w) => (w.side === "right" ? { ...w, x: patch.width! } : w));
    }
    if (patch.height != null) {
      next.wings = next.wings.map((w) => ({ ...w, height: patch.height! }));
    }
    onChange(next);
  };

  return (
    <div className={styles.setup}>
      <button className={styles.setupToggle} onClick={() => setOpen((v) => !v)}>
        Stage setup {open ? "▲" : "▼"}
      </button>

      {open && (
        <div className={styles.setupBody}>
          <div className={styles.fieldRow}>
            <label className={styles.field}>
              Stage width (ft)
              <input
                type="number"
                min={20}
                step={1}
                value={stageConfig.width}
                onChange={(e) => patchStage({ width: Number(e.target.value) })}
              />
            </label>
            <label className={styles.field}>
              Depth (ft)
              <input
                type="number"
                min={15}
                step={1}
                value={stageConfig.height}
                onChange={(e) => patchStage({ height: Number(e.target.value) })}
              />
            </label>
          </div>

          <h3 className={styles.setupHeading}>Risers</h3>
          <div className={styles.checkRow}>
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                className={grid.rows === preset.rows && grid.cols === preset.cols ? styles.chipActive : styles.chip}
                onClick={() => {
                  const nextGrid = presetRiserGrid(preset.rows, preset.cols, stageConfig.width, grid.stairs);
                  onChange({ ...stageConfig, riserGrid: nextGrid, risers: buildRiserGrid(nextGrid) });
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className={styles.fieldRow}>
            <label className={styles.field}>
              Rows
              <input
                type="number"
                min={0}
                max={10}
                value={grid.rows}
                onChange={(e) => patchGrid({ rows: Math.max(0, Number(e.target.value)) })}
              />
            </label>
            <label className={styles.field}>
              Across
              <input
                type="number"
                min={0}
                max={12}
                value={grid.cols}
                onChange={(e) => patchGrid({ cols: Math.max(0, Number(e.target.value)) })}
              />
            </label>
          </div>
          <div className={styles.fieldRow}>
            <label className={styles.field}>
              Riser width
              <input
                type="number"
                min={1}
                step={0.5}
                value={grid.riserWidth}
                onChange={(e) => patchGrid({ riserWidth: Number(e.target.value) })}
              />
            </label>
            <label className={styles.field}>
              Riser depth
              <input
                type="number"
                min={1}
                step={0.2}
                value={grid.riserHeight}
                onChange={(e) => patchGrid({ riserHeight: Number(e.target.value) })}
              />
            </label>
          </div>
          <div className={styles.fieldRow}>
            <label className={styles.field}>
              Gap across
              <input
                type="number"
                min={0}
                step={0.2}
                value={grid.gapX}
                onChange={(e) => patchGrid({ gapX: Number(e.target.value) })}
              />
            </label>
            <label className={styles.field}>
              Gap back
              <input
                type="number"
                min={0}
                step={0.2}
                value={grid.gapY}
                onChange={(e) => patchGrid({ gapY: Number(e.target.value) })}
              />
            </label>
          </div>

          <div className={styles.field}>
            Stairs on
            <div className={styles.checkRow}>
              {STAIR_EDGES.map((edge) => (
                <label key={edge} className={styles.checkItem}>
                  <input
                    type="checkbox"
                    checked={grid.stairs?.[edge] ?? false}
                    onChange={(e) => patchGrid({ stairs: { ...grid.stairs, [edge]: e.target.checked } })}
                  />
                  {edge}
                </label>
              ))}
            </div>
          </div>

          <h3 className={styles.setupHeading}>Grid</h3>
          <div className={styles.field}>
            Spacing
            <div className={styles.checkRow}>
              {GRID_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  className={stageConfig.gridSpacingFt === opt ? styles.chipActive : styles.chip}
                  onClick={() => onChange({ ...stageConfig, gridSpacingFt: opt })}
                >
                  {opt === 0 ? "Off" : `${opt} ft`}
                </button>
              ))}
            </div>
          </div>
          <label className={styles.checkItem}>
            <input
              type="checkbox"
              checked={stageConfig.snapToGrid}
              onChange={(e) => onChange({ ...stageConfig, snapToGrid: e.target.checked })}
            />
            Snap to grid when dragging
          </label>

          <h3 className={styles.setupHeading}>Wings</h3>
          <label className={styles.field}>
            Wing width (ft)
            <input
              type="number"
              min={0}
              step={1}
              value={stageConfig.wings[0]?.width ?? 0}
              onChange={(e) => {
                const width = Number(e.target.value);
                onChange({
                  ...stageConfig,
                  wings: stageConfig.wings.map((w) =>
                    w.side === "left" ? { ...w, width, x: -width } : { ...w, width, x: stageConfig.width },
                  ),
                });
              }}
            />
          </label>
        </div>
      )}
    </div>
  );
}
