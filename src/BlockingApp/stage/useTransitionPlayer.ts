import { useEffect, useRef, useState } from "react";

const TRANSITION_MS = 1400;

interface PlayerState {
  index: number;
  progress: number;
  isPlaying: boolean;
}

/**
 * Drives play/pause/step/scrub across a sequence of `length` Pictures.
 * `resetKey` (e.g. the current song id) resets to Picture 0 whenever it changes.
 */
export function useTransitionPlayer(length: number, resetKey: string) {
  const [state, setState] = useState<PlayerState>({ index: 0, progress: 0, isPlaying: false });
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const lengthRef = useRef(length);
  lengthRef.current = length;

  useEffect(() => {
    setState({ index: 0, progress: 0, isPlaying: false });
  }, [resetKey]);

  useEffect(() => {
    if (!state.isPlaying) {
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
        if (!prev.isPlaying) return prev;
        let { index, progress } = prev;
        progress += dt / TRANSITION_MS;
        while (progress >= 1) {
          if (index >= lengthRef.current - 1) {
            return { index: lengthRef.current - 1, progress: 0, isPlaying: false };
          }
          index += 1;
          progress -= 1;
        }
        return { index, progress, isPlaying: true };
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [state.isPlaying]);

  const play = () =>
    setState((prev) => {
      if (prev.index >= lengthRef.current - 1 && prev.progress === 0) return prev;
      return { ...prev, isPlaying: true };
    });

  const pause = () => setState((prev) => ({ ...prev, isPlaying: false }));

  const stepNext = () =>
    setState((prev) => ({ index: Math.min(prev.index + 1, lengthRef.current - 1), progress: 0, isPlaying: false }));

  const stepPrev = () =>
    setState((prev) => ({
      index: prev.progress > 0 ? prev.index : Math.max(prev.index - 1, 0),
      progress: 0,
      isPlaying: false,
    }));

  const scrubTo = (value: number) =>
    setState(() => {
      const clamped = Math.max(0, Math.min(lengthRef.current - 1, value));
      const index = Math.min(Math.floor(clamped), Math.max(lengthRef.current - 1, 0));
      const progress = index >= lengthRef.current - 1 ? 0 : clamped - index;
      return { index, progress, isPlaying: false };
    });

  return {
    index: state.index,
    progress: state.progress,
    isPlaying: state.isPlaying,
    canStepPrev: state.index > 0 || state.progress > 0,
    canStepNext: state.index < lengthRef.current - 1,
    play,
    pause,
    stepNext,
    stepPrev,
    scrubTo,
  };
}
