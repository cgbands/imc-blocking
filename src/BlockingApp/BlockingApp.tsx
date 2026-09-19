import { useEffect, useMemo, useState } from "react";
import type { DataService } from "../data/DataService";
import { MockDataService } from "../data/MockDataService";
import type { Member, Mic, Picture, Prop, Song, StageConfig } from "../types";
import { useViewport } from "./layout/useViewport";
import { useTransitionPlayer } from "./stage/useTransitionPlayer";
import { PhoneLayout } from "./layout/PhoneLayout";
import { TabletLayout } from "./layout/TabletLayout";
import { DesktopLayout } from "./layout/DesktopLayout";
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
  const [isolatedMemberId, setIsolatedMemberId] = useState<string | null>(null);

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
    setCurrentSongId((prev) => prev ?? (songs[0]?.id ?? null));
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

  const handleSelectSong = (songId: string) => {
    setCurrentSongId(songId);
    setIsolatedMemberId(null);
  };

  const handleSelectPerson = (memberId: string) => {
    setIsolatedMemberId((prev) => (prev === memberId ? null : memberId));
  };

  const handleResetSeed = async () => {
    await service.resetSeed();
  };

  const persistCanEdit = (value: boolean) => {
    setCanEdit(value);
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
    playerIndex: player.index,
    canStepPrev: player.canStepPrev,
    canStepNext: player.canStepNext,
    onPlayPause: player.isPlaying ? player.pause : player.play,
    onStepPrev: player.stepPrev,
    onStepNext: player.stepNext,
    onScrub: player.scrubTo,
    showTrails,
    onToggleTrails: setShowTrails,

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
  };

  return (
    <div className={styles.root}>
      {viewport.layout === "phone" && <PhoneLayout {...layoutProps} />}
      {viewport.layout === "tablet" && <TabletLayout {...layoutProps} />}
      {viewport.layout === "desktop" && <DesktopLayout {...layoutProps} />}
    </div>
  );
}
