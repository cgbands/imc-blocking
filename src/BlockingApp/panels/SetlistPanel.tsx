import type { Picture, Song } from "../../types";
import styles from "./panels.module.css";

interface SetlistPanelProps {
  songs: Song[];
  currentSongId: string | null;
  currentPicture: Picture | undefined;
  compact?: boolean;
}

export function SetlistPanel({ songs, currentSongId, currentPicture, compact }: SetlistPanelProps) {
  return (
    <div className={styles.panel} data-compact={compact || undefined}>
      <h2 className={styles.panelTitle}>Setlist</h2>
      <ul className={styles.songList}>
        {songs.map((song) => (
          <li key={song.id} className={song.id === currentSongId ? styles.songActive : undefined}>
            {song.title}
          </li>
        ))}
      </ul>
      {currentPicture && (
        <div className={styles.pictureNote}>
          Picture: <strong>{currentPicture.label}</strong>
        </div>
      )}
      <p className={styles.hint}>Song &amp; Picture navigation arrives in Phase 2.</p>
    </div>
  );
}
