import type { Picture } from "../../types";
import type { TransitionSpeed } from "../playbackSpeed";
import styles from "./panels.module.css";
import editorStyles from "./editor.module.css";

const SPEED_LABELS: Record<TransitionSpeed, string> = { slow: "Slow", normal: "Normal", fast: "Fast" };

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
  transitionSpeed: TransitionSpeed;
  onSetTransitionSpeed: (speed: TransitionSpeed) => void;
  compact?: boolean;
  canEdit?: boolean;
  onMovePicture?: (index: number, delta: number) => void;
  onDuplicatePicture?: (index: number) => void;
  onDeletePicture?: (index: number) => void;
  memberInCurrentPicture?: boolean;
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
  transitionSpeed,
  onSetTransitionSpeed,
  compact,
  canEdit,
  onMovePicture,
  onDuplicatePicture,
  onDeletePicture,
  memberInCurrentPicture = true,
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
      {!memberInCurrentPicture && <p className={styles.absentNote}>You&rsquo;re not in this picture.</p>}

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

      <div className={styles.speedRow}>
        <span className={styles.speedLabel}>Speed</span>
        {(Object.keys(SPEED_LABELS) as TransitionSpeed[]).map((speed) => (
          <button
            key={speed}
            className={speed === transitionSpeed ? editorStyles.chipActive : editorStyles.chip}
            onClick={() => onSetTransitionSpeed(speed)}
          >
            {SPEED_LABELS[speed]}
          </button>
        ))}
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
