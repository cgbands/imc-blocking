import type { PropKind } from "../../types";
import styles from "./editor.module.css";

interface EditorToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  selectionCount: number;
  onUndo: () => void;
  onRedo: () => void;
  onAddProp: (kind: PropKind) => void;
  onDuplicatePicture: () => void;
  onAlign: (mode: "left" | "right" | "top" | "bottom" | "centerX" | "centerY") => void;
  onDistribute: (axis: "x" | "y") => void;
  onDelete: () => void;
  floating?: boolean;
  /** Single scrolling row — used where width is tight (phone sheet). */
  scrollable?: boolean;
}

export function EditorToolbar({
  canUndo,
  canRedo,
  selectionCount,
  onUndo,
  onRedo,
  onAddProp,
  onDuplicatePicture,
  onAlign,
  onDistribute,
  onDelete,
  floating,
  scrollable,
}: EditorToolbarProps) {
  return (
    <div
      className={floating ? styles.toolbarFloating : styles.toolbar}
      data-scrollable={scrollable || undefined}
    >
      <div className={styles.toolGroup}>
        <button className={styles.toolBtn} onClick={onUndo} disabled={!canUndo} title="Undo (Cmd/Ctrl+Z)">
          ↶
        </button>
        <button className={styles.toolBtn} onClick={onRedo} disabled={!canRedo} title="Redo (Cmd/Ctrl+Shift+Z)">
          ↷
        </button>
      </div>

      <div className={styles.toolGroup}>
        <button className={styles.toolBtn} onClick={() => onAddProp("rectangle")} title="Add rectangle prop">
          ▭
        </button>
        <button className={styles.toolBtn} onClick={() => onAddProp("square")} title="Add square prop">
          ◻
        </button>
        <button className={styles.toolBtn} onClick={() => onAddProp("circle")} title="Add circle prop">
          ◯
        </button>
      </div>

      <div className={styles.toolGroup}>
        <button className={styles.toolBtn} onClick={onDuplicatePicture} title="Duplicate this Picture (Cmd/Ctrl+D)">
          ⧉
        </button>
        <button className={styles.toolBtn} onClick={onDelete} disabled={selectionCount === 0} title="Remove selection from this Picture (Delete)">
          ⌫
        </button>
      </div>

      <div className={styles.toolGroup} data-disabled={selectionCount < 2 || undefined}>
        <button className={styles.toolBtn} onClick={() => onAlign("left")} disabled={selectionCount < 2} title="Align left">
          ⇤
        </button>
        <button className={styles.toolBtn} onClick={() => onAlign("centerX")} disabled={selectionCount < 2} title="Align centre (vertical axis)">
          ↔
        </button>
        <button className={styles.toolBtn} onClick={() => onAlign("right")} disabled={selectionCount < 2} title="Align right">
          ⇥
        </button>
        <button className={styles.toolBtn} onClick={() => onAlign("top")} disabled={selectionCount < 2} title="Align top">
          ⤒
        </button>
        <button className={styles.toolBtn} onClick={() => onAlign("centerY")} disabled={selectionCount < 2} title="Align middle (horizontal axis)">
          ↕
        </button>
        <button className={styles.toolBtn} onClick={() => onAlign("bottom")} disabled={selectionCount < 2} title="Align bottom">
          ⤓
        </button>
      </div>

      <div className={styles.toolGroup}>
        <button className={styles.toolBtn} onClick={() => onDistribute("x")} disabled={selectionCount < 3} title="Distribute horizontally">
          ⋯
        </button>
        <button className={styles.toolBtn} onClick={() => onDistribute("y")} disabled={selectionCount < 3} title="Distribute vertically">
          ⋮
        </button>
      </div>

      {selectionCount > 0 && <span className={styles.selectionCount}>{selectionCount} selected</span>}
    </div>
  );
}
