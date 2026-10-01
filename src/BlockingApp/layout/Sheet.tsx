import { useRef, useState } from "react";
import type { ReactNode } from "react";
import styles from "./Sheet.module.css";

export type SheetState = "peek" | "half" | "full";

interface SheetProps {
  children: ReactNode;
  onStateChange?: (state: SheetState) => void;
  /** Short label next to the drag handle so it reads as "drag this for X", not just an unlabeled bar. */
  label?: string;
}

const HEIGHTS: Record<SheetState, string> = {
  peek: "14%",
  half: "48%",
  full: "88%",
};

const ORDER: SheetState[] = ["peek", "half", "full"];

export function Sheet({ children, onStateChange, label }: SheetProps) {
  const [state, setStateRaw] = useState<SheetState>("half");
  const dragStart = useRef<{ y: number; state: SheetState } | null>(null);

  const setState = (next: SheetState) => {
    setStateRaw(next);
    onStateChange?.(next);
  };

  const cycle = () => {
    const idx = ORDER.indexOf(state);
    setState(ORDER[(idx + 1) % ORDER.length]);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    dragStart.current = { y: e.clientY, state };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragStart.current) return;
    const dy = e.clientY - dragStart.current.y;
    const idx = ORDER.indexOf(dragStart.current.state);
    if (dy < -40 && idx < ORDER.length - 1) setState(ORDER[idx + 1]);
    else if (dy > 40 && idx > 0) setState(ORDER[idx - 1]);
    dragStart.current = null;
  };

  return (
    <div className={styles.sheet} style={{ height: HEIGHTS[state] }}>
      <button
        className={styles.handle}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onClick={cycle}
        aria-label={label ? `Drag to resize ${label}` : "Resize panel"}
      >
        <span className={styles.handleBar} aria-hidden />
        {label && <span className={styles.handleLabel}>{label}</span>}
      </button>
      <div className={styles.body}>{children}</div>
    </div>
  );
}
