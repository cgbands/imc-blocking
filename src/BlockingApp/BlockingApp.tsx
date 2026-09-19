import { useEffect, useMemo, useState } from "react";
import type { DataService } from "../data/DataService";
import { MockDataService } from "../data/MockDataService";
import type { Member, Mic, Picture, Prop, Song, StageConfig } from "../types";
import { useViewport } from "./layout/useViewport";
import { useTransitionPlayer } from "./stage/useTransitionPlayer";
import { useEditor } from "./editor/useEditor";
import { useKeyboardShortcuts } from "./editor/useKeyboardShortcuts";
import { PhoneLayout } from "./layout/PhoneLayout";
import { TabletLayout } from "./layout/TabletLayout";
import { DesktopLayout } from "./layout/DesktopLayout";
import { ShortcutSheet } from "./panels/ShortcutSheet";
import styles from "./BlockingApp.module.css";

export interface BlockingAppProps {
  currentMemberId?: string;
  canEdit?: boolean;
  dataService?: DataService;
}

interface ShowState {
  members: Member[];
  songs: Song[];
  pictures: Picture[];
  props: Prop[];
  mics: Mic[];
  stageConfig: StageConfig;
}

const CAN_EDIT_STORAGE_KEY = "imc-blocking:can-edit";

export function BlockingApp({ currentMemberId: initialMemberId, canEdit: initialCanEdit, dataService }: BlockingAppProps) {
  const service = useMemo(() => dataService ?? new MockDataService(), [dataService]);
  const [show, setShow] = useState<ShowState | null>(null);
  const [currentMemberId, setCurrentMemberId] = useState(initialMemberId ?? "");
  const [canEdit, setCanEdit] = useState(() => {
    if (initialCanEdit) return true;
    try {
      return localStorage.getItem(CAN_EDIT_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [currentSongId, setCurrentSongId] = useState<string | null>(null);
  const [showTrails, setShowTrails] = useState(false);
  // 106 names at full-stage zoom is unreadable on a phone, so phones start
  // shape-only (the toggle and zooming both bring names back).
  const [showNames, setShowNames] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth >= 600;
  });
  const [isolatedMemberId, setIsolatedMemberId] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const loadAll = async () => {
    const [members, songs, stageConfig, props, mics] = await Promise.all([
      service.getMembers(),
      service.getSetlist(),
      service.getStageConfig(),
      service.getProps(),
      service.getMics(),
    ]);
    const allPictures = (await Promise.all(songs.map((s) => service.getPictures(s.id)))).flat();
    setShow({ members, songs, pictures: allPictures, props, mics, stageConfig });
    if (!currentMemberId && members.length) setCurrentMemberId(members[0].id);
    setCurrentSongId((prev) => prev ?? songs[0]?.id ?? null);
  };

  useEffect(() => {
    loadAll();
    return service.subscribe(() => loadAll());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service]);

  const viewport = useViewport();

  const membersById = useMemo(() => new Map((show?.members ?? []).map((m) => [m.id, m])), [show]);
  const propsById = useMemo(() => new Map((show?.props ?? []).map((p) => [p.id, p])), [show]);
  const micsById = useMemo(() => new Map((show?.mics ?? []).map((m) => [m.id, m])), [show]);

  const songPictures = useMemo(
    () => (show?.pictures ?? []).filter((p) => p.songId === currentSongId).sort((a, b) => a.order - b.order),
    [show, currentSongId],
  );

  const player = useTransitionPlayer(songPictures.length, currentSongId ?? "");
  const currentPicture = songPictures[player.index];
  const nextPicture = songPictures[player.index + 1] ?? null;

  const editor = useEditor({
    service,
    canEdit,
    currentSongId,
    songPictures,
    currentPicture,
    currentPictureIndex: player.index,
    stageConfig: show?.stageConfig,
    props: show?.props ?? [],
    songs: show?.songs ?? [],
    membersById,
  });

  const selectionCount = editor.selection.memberIds.length + editor.selection.propIds.length;

  useKeyboardShortcuts({
    enabled: viewport.layout === "desktop" || !viewport.coarsePointer,
    hasSelection: selectionCount > 0,
    canEdit,
    onNudge: editor.nudgeSelection,
    onStepPrev: player.stepPrev,
    onStepNext: player.stepNext,
    onPlayPause: player.isPlaying ? player.pause : player.play,
    onUndo: editor.undo,
    onRedo: editor.redo,
    onDuplicatePicture: () => editor.duplicatePicture(player.index),
    onDelete: editor.removeSelectionFromPicture,
    onFindMe: () => {
      // Wired up in Phase 5.
    },
    onToggleHelp: () => setShowHelp((v) => !v),
    onEscape: () => {
      editor.clearSelection();
      setShowHelp(false);
    },
  });

  const handleSelectSong = (songId: string) => {
    setCurrentSongId(songId);
    setIsolatedMemberId(null);
    editor.clearSelection();
  };

  const handleSelectPerson = (memberId: string) => {
    setIsolatedMemberId((prev) => (prev === memberId ? null : memberId));
  };

  const handleResetSeed = async () => {
    await service.resetSeed();
  };

  const persistCanEdit = (value: boolean) => {
    setCanEdit(value);
    if (!value) editor.clearSelection();
    try {
      localStorage.setItem(CAN_EDIT_STORAGE_KEY, String(value));
    } catch {
      // localStorage unavailable (private mode, etc.) — role just won't persist
    }
  };

  if (!show) {
    return <div className={styles.root} />;
  }

  const layoutProps = {
    stageConfig: show.stageConfig,
    songs: show.songs,
    currentSongId,
    onSelectSong: handleSelectSong,

    songPictures,
    currentPicture,
    nextPicture,
    progress: player.progress,
    isPlaying: player.isPlaying,
    isAnimating: player.isAnimating,
    playerIndex: player.index,
    canStepPrev: player.canStepPrev,
    canStepNext: player.canStepNext,
    onPlayPause: player.isPlaying ? player.pause : player.play,
    onStepPrev: player.stepPrev,
    onStepNext: player.stepNext,
    onScrub: player.scrubTo,
    onJumpToPicture: player.jumpTo,
    showTrails,
    onToggleTrails: setShowTrails,
    showNames,
    onToggleNames: setShowNames,

    members: show.members,
    membersById,
    propsById,
    micsById,
    isolatedMemberId,
    onSelectPerson: handleSelectPerson,

    currentMemberId,
    canEdit,
    onChangeMember: setCurrentMemberId,
    onToggleRole: persistCanEdit,
    onResetSeed: handleResetSeed,
    onEditorLogin: () => persistCanEdit(true),
    onEditorLogout: () => persistCanEdit(false),

    // Editing
    coarsePointer: viewport.coarsePointer,
    selection: editor.selection,
    selectionCount,
    onSelectionChange: editor.setSelection,
    onMovePeople: editor.movePeopleTo,
    onMoveProps: editor.movePropsTo,
    onMoveMics: editor.moveMicsTo,
    onAssignMic: editor.assignMic,
    mics: show.mics,
    micPlacements: currentPicture?.mics ?? [],
    snapValue: editor.snapValue,
    canUndo: editor.canUndo,
    canRedo: editor.canRedo,
    onUndo: editor.undo,
    onRedo: editor.redo,
    onAddProp: editor.addProp,
    onUpdateProp: editor.updateProp,
    onDeleteProp: editor.deleteProp,
    onUpdateMember: editor.updateMember,
    onAlign: editor.alignSelection,
    onDistribute: editor.distributeSelection,
    onDeleteSelection: editor.removeSelectionFromPicture,
    onDuplicatePicture: editor.duplicatePicture,
    onDeletePicture: editor.deletePicture,
    onMovePicture: editor.movePicture,
    onMoveSong: editor.moveSong,
    onUpdateStageConfig: editor.updateStageConfig,
    onShowHelp: () => setShowHelp(true),
  };

  return (
    <div className={styles.root}>
      {viewport.layout === "phone" && <PhoneLayout {...layoutProps} />}
      {viewport.layout === "tablet" && <TabletLayout {...layoutProps} />}
      {viewport.layout === "desktop" && <DesktopLayout {...layoutProps} />}
      {showHelp && <ShortcutSheet onClose={() => setShowHelp(false)} />}
    </div>
  );
}
