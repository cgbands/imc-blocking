import type { Picture } from "../../types";
import styles from "./panels.module.css";

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
  showTrails: boolean;
  onToggleTrails: (value: boolean) => void;
  compact?: boolean;
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
  showTrails,
  onToggleTrails,
  compact,
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

      <label className={styles.trailsToggle}>
        <input type="checkbox" checked={showTrails} onChange={(e) => onToggleTrails(e.target.checked)} />
        Show path trails
      </label>

      {!compact && (
        <ul className={styles.pictureList}>
          {pictures.map((p, i) => (
            <li key={p.id}>
              <button className={i === currentIndex ? styles.pictureActive : styles.pictureBtn} onClick={() => onScrub(i)}>
                {i + 1}. {p.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
