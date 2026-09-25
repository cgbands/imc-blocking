import styles from "./FindMeButton.module.css";

interface FindMeButtonProps {
  active: boolean;
  onClick: () => void;
  inPicture: boolean;
  floating?: boolean;
}

export function FindMeButton({ active, onClick, inPicture, floating }: FindMeButtonProps) {
  const showNote = active && !inPicture;
  return (
    <div className={floating ? styles.floatingWrap : styles.inlineWrap}>
      {showNote && <div className={styles.note}>You&rsquo;re not in this picture.</div>}
      <button
        className={`${floating ? styles.floating : styles.inline} ${active ? styles.active : ""}`}
        onClick={onClick}
        aria-pressed={active}
        title="Find Me (F)"
      >
        <span aria-hidden>◎</span> Find Me
      </button>
    </div>
  );
}
