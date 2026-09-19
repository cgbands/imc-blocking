import styles from "./editor.module.css";

const SHORTCUTS: [string, string][] = [
  ["← / →", "Previous / next Picture"],
  ["Space", "Play / pause"],
  ["F", "Find Me"],
  ["Arrows", "Nudge selection (editor, with something selected)"],
  ["Shift + arrows", "Nudge further"],
  ["Delete", "Remove selection from this Picture"],
  ["Cmd/Ctrl + Z", "Undo"],
  ["Cmd/Ctrl + Shift + Z", "Redo"],
  ["Cmd/Ctrl + D", "Duplicate Picture"],
  ["Drag on empty stage", "Marquee select (editor)"],
  ["Space + drag", "Pan"],
  ["Scroll / pinch", "Zoom"],
  ["Esc", "Clear selection"],
  ["?", "Toggle this sheet"],
];

export function ShortcutSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className={styles.sheetBackdrop} onClick={onClose}>
      <div className={styles.shortcutSheet} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.inspectorTitle}>Shortcuts</h2>
        <dl className={styles.shortcutList}>
          {SHORTCUTS.map(([keys, description]) => (
            <div key={keys} className={styles.shortcutRow}>
              <dt>
                <kbd>{keys}</kbd>
              </dt>
              <dd>{description}</dd>
            </div>
          ))}
        </dl>
        <button className={styles.toolBtn} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
