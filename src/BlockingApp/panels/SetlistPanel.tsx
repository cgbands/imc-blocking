import type { Song } from "../../types";
import styles from "./panels.module.css";

interface SetlistPanelProps {
  songs: Song[];
  currentSongId: string | null;
  onSelectSong: (songId: string) => void;
  compact?: boolean;
}

export function SetlistPanel({ songs, currentSongId, onSelectSong, compact }: SetlistPanelProps) {
  return (
    <div className={styles.panel} data-compact={compact || undefined}>
      <h2 className={styles.panelTitle}>Setlist</h2>
      <ul className={styles.songList}>
        {songs.map((song) => (
          <li key={song.id}>
            <button
              className={song.id === currentSongId ? styles.songActive : styles.songBtn}
              onClick={() => onSelectSong(song.id)}
            >
              {song.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
