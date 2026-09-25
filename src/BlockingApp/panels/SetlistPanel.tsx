import type { Song } from "../../types";
import styles from "./panels.module.css";
import editorStyles from "./editor.module.css";

interface SetlistPanelProps {
  songs: Song[];
  currentSongId: string | null;
  onSelectSong: (songId: string) => void;
  compact?: boolean;
  canEdit?: boolean;
  onMoveSong?: (index: number, delta: number) => void;
  absentSongIds?: Set<string>;
}

export function SetlistPanel({
  songs,
  currentSongId,
  onSelectSong,
  compact,
  canEdit,
  onMoveSong,
  absentSongIds,
}: SetlistPanelProps) {
  return (
    <div className={styles.panel} data-compact={compact || undefined}>
      <h2 className={styles.panelTitle}>Setlist</h2>
      <ul className={styles.songList}>
        {songs.map((song, i) => (
          <li key={song.id}>
            <div className={editorStyles.pictureRow}>
              <button
                className={song.id === currentSongId ? styles.songActive : styles.songBtn}
                onClick={() => onSelectSong(song.id)}
              >
                {song.title}
              </button>
              {canEdit && (
                <>
                  <button
                    className={editorStyles.rowBtn}
                    onClick={() => onMoveSong?.(i, -1)}
                    disabled={i === 0}
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    className={editorStyles.rowBtn}
                    onClick={() => onMoveSong?.(i, 1)}
                    disabled={i === songs.length - 1}
                    title="Move down"
                  >
                    ↓
                  </button>
                </>
              )}
            </div>
            {absentSongIds?.has(song.id) && <p className={styles.absentNote}>You&rsquo;re not in this song.</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
