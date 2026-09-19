import { useEffect, useRef, useState } from "react";

/** How long one Picture-to-Picture transition takes. */
const TRANSITION_MS = 1400;
const EPSILON = 1e-4;

interface PlayerState {
  index: number;
  progress: number;
  /** continuous position (index units) being animated toward; null when idle */
  target: number | null;
  /** true when the current animation came from Play (vs. a step/jump) */
  playingToEnd: boolean;
}

const IDLE: PlayerState = { index: 0, progress: 0, target: null, playingToEnd: false };

/**
 * Drives play/pause/step/scrub across a sequence of `length` Pictures.
 * Stepping and jumping animate people along their paths rather than cutting,
 * in both directions. `resetKey` (the current song id) resets to Picture 0.
 */
export function useTransitionPlayer(length: number, resetKey: string) {
  const [state, setState] = useState<PlayerState>(IDLE);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const lengthRef = useRef(length);
  lengthRef.current = length;

  useEffect(() => {
    setState(IDLE);
  }, [resetKey]);

  const isAnimating = state.target !== null;

  useEffect(() => {
    if (!isAnimating) {
      lastTsRef.current = null;
      return;
    }
    let cancelled = false;
    const tick = (ts: number) => {
      if (cancelled) return;
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = ts - lastTsRef.current;
      lastTsRef.current = ts;

      setState((prev) => {
        if (prev.target == null) return prev;
        const pos = prev.index + prev.progress;
        const step = dt / TRANSITION_MS;
        const next = prev.target > pos ? Math.min(pos + step, prev.target) : Math.max(pos - step, prev.target);

        if (Math.abs(next - prev.target) < EPSILON) {
          return { index: Math.round(prev.target), progress: 0, target: null, playingToEnd: false };
        }
        const index = Math.floor(next);
        return { index, progress: next - index, target: prev.target, playingToEnd: prev.playingToEnd };
      });

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [isAnimating]);

  const animateTo = (target: number, playingToEnd = false) =>
    setState((prev) => {
      const clamped = Math.max(0, Math.min(lengthRef.current - 1, target));
      if (Math.abs(clamped - (prev.index + prev.progress)) < EPSILON) return prev;
      return { ...prev, target: clamped, playingToEnd };
    });

  const play = () => animateTo(lengthRef.current - 1, true);

  const pause = () => setState((prev) => ({ ...prev, target: null, playingToEnd: false }));

  const stepNext = () => animateTo(Math.floor(state.index + state.progress) + 1);

  const stepPrev = () => animateTo(state.progress > EPSILON ? state.index : state.index - 1);

  /** Animate through to a specific Picture, playing each transition on the way. */
  const jumpTo = (index: number) => animateTo(index);

  /** Manual scrub — lands exactly where the user drags, no animation. */
  const scrubTo = (value: number) =>
    setState(() => {
      const clamped = Math.max(0, Math.min(lengthRef.current - 1, value));
      const index = Math.min(Math.floor(clamped), Math.max(lengthRef.current - 1, 0));
      const progress = index >= lengthRef.current - 1 ? 0 : clamped - index;
      return { index, progress, target: null, playingToEnd: false };
    });

  return {
    index: state.index,
    progress: state.progress,
    isPlaying: state.playingToEnd && isAnimating,
    isAnimating,
    canStepPrev: state.index > 0 || state.progress > EPSILON,
    canStepNext: state.index + state.progress < lengthRef.current - 1 - EPSILON,
    play,
    pause,
    stepNext,
    stepPrev,
    jumpTo,
    scrubTo,
  };
}
