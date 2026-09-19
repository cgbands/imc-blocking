import { useEffect } from "react";

export interface ShortcutHandlers {
  enabled: boolean;
  hasSelection: boolean;
  canEdit: boolean;
  onNudge: (dx: number, dy: number) => void;
  onStepPrev: () => void;
  onStepNext: () => void;
  onPlayPause: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDuplicatePicture: () => void;
  onDelete: () => void;
  onFindMe: () => void;
  onToggleHelp: () => void;
  onEscape: () => void;
}

const NUDGE_FT = 0.5;
const NUDGE_FT_LARGE = 2;

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

/** Desktop keyboard shortcuts. See ShortcutSheet for the user-facing list. */
export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    if (!handlers.enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      const mod = e.metaKey || e.ctrlKey;
      const step = e.shiftKey ? NUDGE_FT_LARGE : NUDGE_FT;

      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) handlers.onRedo();
        else handlers.onUndo();
        return;
      }
      if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        handlers.onDuplicatePicture();
        return;
      }
      if (mod) return;

      switch (e.key) {
        case "ArrowLeft":
        case "ArrowRight": {
          e.preventDefault();
          const forward = e.key === "ArrowRight";
          // Arrows nudge a selection when editing, otherwise step Pictures.
          if (handlers.canEdit && handlers.hasSelection) handlers.onNudge(forward ? step : -step, 0);
          else if (forward) handlers.onStepNext();
          else handlers.onStepPrev();
          return;
        }
        case "ArrowUp":
        case "ArrowDown": {
          if (!handlers.canEdit || !handlers.hasSelection) return;
          e.preventDefault();
          handlers.onNudge(0, e.key === "ArrowDown" ? step : -step);
          return;
        }
        case " ":
          e.preventDefault();
          handlers.onPlayPause();
          return;
        case "Delete":
        case "Backspace":
          if (!handlers.canEdit || !handlers.hasSelection) return;
          e.preventDefault();
          handlers.onDelete();
          return;
        case "f":
        case "F":
          handlers.onFindMe();
          return;
        case "?":
          handlers.onToggleHelp();
          return;
        case "Escape":
          handlers.onEscape();
          return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlers]);
}
