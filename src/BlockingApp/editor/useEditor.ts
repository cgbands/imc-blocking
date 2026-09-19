import { useCallback, useRef, useState } from "react";
import type { DataService } from "../../data/DataService";
import type { Member, Picture, Prop, PropKind, Song, StageConfig } from "../../types";

const HISTORY_LIMIT = 60;

/**
 * One reversible edit. Kept as before/after pairs rather than full snapshots
 * so a drag of a few people doesn't clone the whole show.
 */
export type EditAction =
  | { kind: "picture"; songId: string; before: Picture; after: Picture }
  | { kind: "songPictures"; songId: string; before: Picture[]; after: Picture[] }
  | { kind: "stage"; before: StageConfig; after: StageConfig }
  | { kind: "member"; before: Member; after: Member }
  | { kind: "props"; before: Prop[]; after: Prop[] }
  /** Several changes that undo as one step (e.g. adding a prop also places it). */
  | { kind: "compound"; actions: EditAction[] };

export interface SelectionState {
  memberIds: string[];
  propIds: string[];
}

const EMPTY_SELECTION: SelectionState = { memberIds: [], propIds: [] };

interface UseEditorArgs {
  service: DataService;
  canEdit: boolean;
  currentSongId: string | null;
  songPictures: Picture[];
  currentPicture: Picture | undefined;
  stageConfig: StageConfig | undefined;
  props: Prop[];
  songs: Song[];
  membersById: Map<string, Member>;
}

export function useEditor({
  service,
  canEdit,
  currentSongId,
  songPictures,
  currentPicture,
  stageConfig,
  props,
  songs,
  membersById,
}: UseEditorArgs) {
  const [selection, setSelection] = useState<SelectionState>(EMPTY_SELECTION);
  const undoStack = useRef<EditAction[]>([]);
  const redoStack = useRef<EditAction[]>([]);
  // Bumped whenever history changes so the toolbar's enabled state re-renders.
  const [historyVersion, setHistoryVersion] = useState(0);

  /**
   * Single funnel for every mutation. When this app moves into the portal,
   * the server-side editor-role check belongs behind these DataService calls —
   * `canEdit` here is only a UI guard.
   */
  const perform = useCallback(
    async (action: EditAction): Promise<void> => {
      switch (action.kind) {
        case "picture":
          await service.savePicture(action.after);
          break;
        case "songPictures":
          await service.saveSongPictures(action.songId, action.after);
          break;
        case "stage":
          await service.saveStageConfig(action.after);
          break;
        case "member":
          await service.saveMember(action.after);
          break;
        case "props":
          await service.saveProps(action.after);
          break;
        case "compound":
          for (const inner of action.actions) await perform(inner);
          break;
      }
    },
    [service],
  );

  const apply = useCallback(
    async (action: EditAction, { recordHistory = true } = {}) => {
      if (!canEdit) return;
      await perform(action);
      if (recordHistory) {
        undoStack.current = [...undoStack.current, action].slice(-HISTORY_LIMIT);
        redoStack.current = [];
        setHistoryVersion((v) => v + 1);
      }
    },
    [canEdit, perform],
  );

  const invert = (action: EditAction): EditAction => {
    switch (action.kind) {
      case "picture":
        return { ...action, before: action.after, after: action.before };
      case "songPictures":
        return { ...action, before: action.after, after: action.before };
      case "stage":
        return { kind: "stage", before: action.after, after: action.before };
      case "member":
        return { kind: "member", before: action.after, after: action.before };
      case "props":
        return { kind: "props", before: action.after, after: action.before };
      case "compound":
        return { kind: "compound", actions: [...action.actions].reverse().map(invert) };
    }
  };

  const undo = useCallback(async () => {
    const action = undoStack.current[undoStack.current.length - 1];
    if (!action) return;
    undoStack.current = undoStack.current.slice(0, -1);
    redoStack.current = [...redoStack.current, action];
    setHistoryVersion((v) => v + 1);
    await apply(invert(action), { recordHistory: false });
  }, [apply]);

  const redo = useCallback(async () => {
    const action = redoStack.current[redoStack.current.length - 1];
    if (!action) return;
    redoStack.current = redoStack.current.slice(0, -1);
    undoStack.current = [...undoStack.current, action];
    setHistoryVersion((v) => v + 1);
    await apply(action, { recordHistory: false });
  }, [apply]);

  const snapValue = useCallback(
    (value: number) => {
      if (!stageConfig?.snapToGrid || !stageConfig.gridSpacingFt) return value;
      const s = stageConfig.gridSpacingFt;
      return Math.round(value / s) * s;
    },
    [stageConfig],
  );

  // --- People -------------------------------------------------------------

  /** Commits new positions for a set of people in the current Picture. */
  const movePeopleTo = useCallback(
    (moves: { memberId: string; x: number; y: number }[]) => {
      if (!currentPicture || !currentSongId || moves.length === 0) return;
      const byId = new Map(moves.map((m) => [m.memberId, m]));
      const after: Picture = {
        ...currentPicture,
        people: currentPicture.people.map((p) => {
          const move = byId.get(p.memberId);
          if (!move) return p;
          const x = snapValue(move.x);
          const y = snapValue(move.y);
          return { ...p, x, y, zone: zoneForX(x, stageConfig) };
        }),
      };
      apply({ kind: "picture", songId: currentSongId, before: currentPicture, after });
    },
    [apply, currentPicture, currentSongId, snapValue, stageConfig],
  );

  /** Nudge (keyboard arrows) — relative move of the whole selection. */
  const nudgeSelection = useCallback(
    (dx: number, dy: number) => {
      if (!currentPicture || !currentSongId) return;
      const memberIds = new Set(selection.memberIds);
      const propIds = new Set(selection.propIds);
      if (memberIds.size === 0 && propIds.size === 0) return;
      const after: Picture = {
        ...currentPicture,
        people: currentPicture.people.map((p) =>
          memberIds.has(p.memberId) ? { ...p, x: p.x + dx, y: p.y + dy, zone: zoneForX(p.x + dx, stageConfig) } : p,
        ),
        props: currentPicture.props.map((p) => (propIds.has(p.propId) ? { ...p, x: p.x + dx, y: p.y + dy } : p)),
      };
      apply({ kind: "picture", songId: currentSongId, before: currentPicture, after });
    },
    [apply, currentPicture, currentSongId, selection, stageConfig],
  );

  /** Removes the selected people from this Picture ("not in this picture"). */
  const removeSelectionFromPicture = useCallback(() => {
    if (!currentPicture || !currentSongId) return;
    const memberIds = new Set(selection.memberIds);
    const propIds = new Set(selection.propIds);
    if (memberIds.size === 0 && propIds.size === 0) return;
    const after: Picture = {
      ...currentPicture,
      people: currentPicture.people.filter((p) => !memberIds.has(p.memberId)),
      props: currentPicture.props.filter((p) => !propIds.has(p.propId)),
    };
    apply({ kind: "picture", songId: currentSongId, before: currentPicture, after });
    setSelection(EMPTY_SELECTION);
  }, [apply, currentPicture, currentSongId, selection]);

  // --- Align / distribute -------------------------------------------------

  type AlignMode = "left" | "right" | "top" | "bottom" | "centerX" | "centerY";

  const alignSelection = useCallback(
    (mode: AlignMode) => {
      if (!currentPicture || !currentSongId) return;
      const ids = new Set(selection.memberIds);
      const targets = currentPicture.people.filter((p) => ids.has(p.memberId));
      if (targets.length < 2) return;

      const xs = targets.map((p) => p.x);
      const ys = targets.map((p) => p.y);
      const value = {
        left: Math.min(...xs),
        right: Math.max(...xs),
        top: Math.min(...ys),
        bottom: Math.max(...ys),
        centerX: xs.reduce((a, b) => a + b, 0) / xs.length,
        centerY: ys.reduce((a, b) => a + b, 0) / ys.length,
      }[mode];

      const horizontal = mode === "left" || mode === "right" || mode === "centerX";
      const after: Picture = {
        ...currentPicture,
        people: currentPicture.people.map((p) =>
          ids.has(p.memberId) ? (horizontal ? { ...p, x: value } : { ...p, y: value }) : p,
        ),
      };
      apply({ kind: "picture", songId: currentSongId, before: currentPicture, after });
    },
    [apply, currentPicture, currentSongId, selection],
  );

  const distributeSelection = useCallback(
    (axis: "x" | "y") => {
      if (!currentPicture || !currentSongId) return;
      const ids = new Set(selection.memberIds);
      const targets = currentPicture.people.filter((p) => ids.has(p.memberId));
      if (targets.length < 3) return;

      const sorted = [...targets].sort((a, b) => a[axis] - b[axis]);
      const start = sorted[0][axis];
      const end = sorted[sorted.length - 1][axis];
      const step = (end - start) / (sorted.length - 1);
      const newValues = new Map(sorted.map((p, i) => [p.memberId, start + step * i]));

      const after: Picture = {
        ...currentPicture,
        people: currentPicture.people.map((p) => {
          const v = newValues.get(p.memberId);
          return v == null ? p : { ...p, [axis]: v };
        }),
      };
      apply({ kind: "picture", songId: currentSongId, before: currentPicture, after });
    },
    [apply, currentPicture, currentSongId, selection],
  );

  // --- Props --------------------------------------------------------------

  const addProp = useCallback(
    (kind: PropKind) => {
      if (!currentSongId || !stageConfig) return;
      const id = `prop-${Date.now().toString(36)}`;
      const prop: Prop = {
        id,
        name: kind === "circle" ? "New circle" : kind === "square" ? "New square" : "New block",
        kind,
        color: "#7d7d7d",
        width: kind === "rectangle" ? 6 : 3,
        height: 3,
      };
      // Give it a placement in every Picture of this song so it persists
      // through the number; editors can then move it per Picture.
      const placed = songPictures.map((p) => ({
        ...p,
        props: [...p.props, { propId: id, x: stageConfig.width / 2, y: stageConfig.height - 8 }],
      }));
      apply({
        kind: "compound",
        actions: [
          { kind: "props", before: props, after: [...props, prop] },
          { kind: "songPictures", songId: currentSongId, before: songPictures, after: placed },
        ],
      });
      setSelection({ memberIds: [], propIds: [id] });
    },
    [apply, currentSongId, props, songPictures, stageConfig],
  );

  const updateProp = useCallback(
    (next: Prop) => {
      const before = props;
      apply({ kind: "props", before, after: props.map((p) => (p.id === next.id ? next : p)) });
    },
    [apply, props],
  );

  const deleteProp = useCallback(
    (propId: string) => {
      if (!currentSongId) return;
      apply({
        kind: "compound",
        actions: [
          { kind: "props", before: props, after: props.filter((p) => p.id !== propId) },
          {
            kind: "songPictures",
            songId: currentSongId,
            before: songPictures,
            after: songPictures.map((p) => ({ ...p, props: p.props.filter((pl) => pl.propId !== propId) })),
          },
        ],
      });
      setSelection(EMPTY_SELECTION);
    },
    [apply, currentSongId, props, songPictures],
  );

  const movePropsTo = useCallback(
    (moves: { propId: string; x: number; y: number }[]) => {
      if (!currentPicture || !currentSongId || moves.length === 0) return;
      const byId = new Map(moves.map((m) => [m.propId, m]));
      const after: Picture = {
        ...currentPicture,
        props: currentPicture.props.map((p) => {
          const move = byId.get(p.propId);
          return move ? { ...p, x: snapValue(move.x), y: snapValue(move.y) } : p;
        }),
      };
      apply({ kind: "picture", songId: currentSongId, before: currentPicture, after });
    },
    [apply, currentPicture, currentSongId, snapValue],
  );

  // --- Members (shape / colour / tag are person-level, not per-Picture) ----

  const updateMember = useCallback(
    (next: Member) => {
      const before = membersById.get(next.id);
      if (!before) return;
      apply({ kind: "member", before, after: next });
    },
    [apply, membersById],
  );

  // --- Pictures -----------------------------------------------------------

  const duplicatePicture = useCallback(
    (index: number) => {
      if (!currentSongId) return;
      const source = songPictures[index];
      if (!source) return;
      const copy: Picture = {
        ...source,
        id: `${source.id}-copy-${Date.now().toString(36)}`,
        label: `${source.label} (copy)`,
        people: source.people.map((p) => ({ ...p })),
        props: source.props.map((p) => ({ ...p })),
        mics: source.mics.map((m) => ({ ...m })),
      };
      const after = [...songPictures.slice(0, index + 1), copy, ...songPictures.slice(index + 1)];
      apply({ kind: "songPictures", songId: currentSongId, before: songPictures, after });
    },
    [apply, currentSongId, songPictures],
  );

  const deletePicture = useCallback(
    (index: number) => {
      if (!currentSongId || songPictures.length <= 1) return;
      const after = songPictures.filter((_, i) => i !== index);
      apply({ kind: "songPictures", songId: currentSongId, before: songPictures, after });
    },
    [apply, currentSongId, songPictures],
  );

  const movePicture = useCallback(
    (index: number, delta: number) => {
      if (!currentSongId) return;
      const target = index + delta;
      if (target < 0 || target >= songPictures.length) return;
      const after = [...songPictures];
      const [moved] = after.splice(index, 1);
      after.splice(target, 0, moved);
      apply({ kind: "songPictures", songId: currentSongId, before: songPictures, after });
    },
    [apply, currentSongId, songPictures],
  );

  const renamePicture = useCallback(
    (index: number, label: string) => {
      if (!currentSongId) return;
      const source = songPictures[index];
      if (!source) return;
      apply({ kind: "picture", songId: currentSongId, before: source, after: { ...source, label } });
    },
    [apply, currentSongId, songPictures],
  );

  const moveSong = useCallback(
    (index: number, delta: number) => {
      const target = index + delta;
      if (target < 0 || target >= songs.length) return;
      const after = [...songs];
      const [moved] = after.splice(index, 1);
      after.splice(target, 0, moved);
      service.saveSetlist(after);
    },
    [service, songs],
  );

  // --- Stage config -------------------------------------------------------

  const updateStageConfig = useCallback(
    (next: StageConfig) => {
      if (!stageConfig) return;
      apply({ kind: "stage", before: stageConfig, after: next });
    },
    [apply, stageConfig],
  );

  return {
    selection,
    setSelection,
    clearSelection: () => setSelection(EMPTY_SELECTION),
    canUndo: undoStack.current.length > 0,
    canRedo: redoStack.current.length > 0,
    historyVersion,
    undo,
    redo,
    snapValue,
    movePeopleTo,
    movePropsTo,
    nudgeSelection,
    removeSelectionFromPicture,
    alignSelection,
    distributeSelection,
    addProp,
    updateProp,
    deleteProp,
    updateMember,
    duplicatePicture,
    deletePicture,
    movePicture,
    renamePicture,
    moveSong,
    updateStageConfig,
  };
}

/** Anything dragged past the stage edges counts as standing in the wings. */
function zoneForX(x: number, stageConfig: StageConfig | undefined) {
  if (!stageConfig) return "stage" as const;
  if (x < 0) return "wings-left" as const;
  if (x > stageConfig.width) return "wings-right" as const;
  return "stage" as const;
}
