import type { Picture } from "../../types";
import styles from "./panels.module.css";
import editorStyles from "./editor.module.css";

interface PictureNavProps {
  pictures: Picture[];
  currentIndex: number;
  progress: number;
  isPlaying: boolean;
  canStepPrev: boolean;
  canStepNext: boolean;
  onPlayPause: () => void;
  onStepPrev: () => void;
  onStepNext: () => void;
  onScrub: (value: number) => void;
  onJumpToPicture: (index: number) => void;
  showTrails: boolean;
  onToggleTrails: (value: boolean) => void;
  showNames: boolean;
  onToggleNames: (value: boolean) => void;
  compact?: boolean;
  canEdit?: boolean;
  onMovePicture?: (index: number, delta: number) => void;
  onDuplicatePicture?: (index: number) => void;
  onDeletePicture?: (index: number) => void;
}

export function PictureNav({
  pictures,
  currentIndex,
  progress,
  isPlaying,
  canStepPrev,
  canStepNext,
  onPlayPause,
  onStepPrev,
  onStepNext,
  onScrub,
  onJumpToPicture,
  showTrails,
  onToggleTrails,
  showNames,
  onToggleNames,
  compact,
  canEdit,
  onMovePicture,
  onDuplicatePicture,
  onDeletePicture,
}: PictureNavProps) {
  const current = pictures[currentIndex];
  const max = Math.max(pictures.length - 1, 0);

  return (
    <div className={styles.nav} data-compact={compact || undefined}>
      <h2 className={styles.panelTitle}>Pictures</h2>

      <div className={styles.transport}>
        <button className={styles.stepBtn} onClick={onStepPrev} disabled={!canStepPrev} aria-label="Previous Picture">
          ‹
        </button>
        <button className={styles.playBtn} onClick={onPlayPause} aria-label={isPlaying ? "Pause" : "Play"}>
          {isPlaying ? "❚❚" : "►"}
        </button>
        <button className={styles.stepBtn} onClick={onStepNext} disabled={!canStepNext} aria-label="Next Picture">
          ›
        </button>
      </div>

      <input
        className={styles.scrubber}
        type="range"
        min={0}
        max={max}
        step={0.001}
        value={currentIndex + progress}
        onChange={(e) => onScrub(Number(e.target.value))}
        aria-label="Scrub through Pictures"
      />

      <div className={styles.currentLabel}>{current ? `${currentIndex + 1}. ${current.label}` : "—"}</div>

      <div className={styles.toggleRow}>
        <label className={styles.trailsToggle}>
          <input type="checkbox" checked={showTrails} onChange={(e) => onToggleTrails(e.target.checked)} />
          Path trails
        </label>
        <label className={styles.trailsToggle}>
          <input type="checkbox" checked={showNames} onChange={(e) => onToggleNames(e.target.checked)} />
          Names
        </label>
      </div>

      {!compact && (
        <ul className={styles.pictureList}>
          {pictures.map((p, i) => (
            <li key={p.id} className={editorStyles.pictureRow}>
              <button
                className={i === currentIndex ? styles.pictureActive : styles.pictureBtn}
                onClick={() => onJumpToPicture(i)}
              >
                {i + 1}. {p.label}
              </button>
              {canEdit && (
                <>
                  <button
                    className={editorStyles.rowBtn}
                    onClick={() => onMovePicture?.(i, -1)}
                    disabled={i === 0}
                    title="Move earlier"
                  >
                    ↑
                  </button>
                  <button
                    className={editorStyles.rowBtn}
                    onClick={() => onMovePicture?.(i, 1)}
                    disabled={i === pictures.length - 1}
                    title="Move later"
                  >
                    ↓
                  </button>
                  <button className={editorStyles.rowBtn} onClick={() => onDuplicatePicture?.(i)} title="Duplicate">
                    ⧉
                  </button>
                  <button
                    className={editorStyles.rowBtn}
                    onClick={() => onDeletePicture?.(i)}
                    disabled={pictures.length <= 1}
                    title="Delete Picture"
                  >
                    ✕
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
