import styles from "./FindMeButton.module.css";

interface FindMeButtonProps {
  onClick?: () => void;
  floating?: boolean;
}

/** Wired up in Phase 5; present now so the layouts read correctly. */
export function FindMeButton({ onClick, floating }: FindMeButtonProps) {
  return (
    <button className={floating ? styles.floating : styles.inline} onClick={onClick} title="Find Me (Phase 5)">
      <span aria-hidden>◎</span> Find Me
    </button>
  );
}
