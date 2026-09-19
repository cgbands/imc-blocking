import { useEffect, useMemo, useState } from "react";
import type { DataService } from "../data/DataService";
import { MockDataService } from "../data/MockDataService";
import type { Member, Picture, Song, StageConfig } from "../types";
import { useViewport } from "./layout/useViewport";
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
  stageConfig: StageConfig;
}

export function BlockingApp({ currentMemberId: initialMemberId, canEdit: initialCanEdit = false, dataService }: BlockingAppProps) {
  const service = useMemo(() => dataService ?? new MockDataService(), [dataService]);
  const [show, setShow] = useState<ShowState | null>(null);
  const [currentMemberId, setCurrentMemberId] = useState(initialMemberId ?? "");
  const [canEdit, setCanEdit] = useState(initialCanEdit);
  const [currentSongId, setCurrentSongId] = useState<string | null>(null);
  const [currentPictureId, setCurrentPictureId] = useState<string | null>(null);

  const loadAll = async () => {
    const [members, songs, stageConfig] = await Promise.all([
      service.getMembers(),
      service.getSetlist(),
      service.getStageConfig(),
    ]);
    const allPictures = (await Promise.all(songs.map((s) => service.getPictures(s.id)))).flat();
    setShow({ members, songs, pictures: allPictures, stageConfig });
    if (!currentMemberId && members.length) setCurrentMemberId(members[0].id);
    if (!currentSongId && songs.length) {
      setCurrentSongId(songs[0].id);
      const first = allPictures.find((p) => p.songId === songs[0].id);
      if (first) setCurrentPictureId(first.id);
    }
  };

  useEffect(() => {
    loadAll();
    return service.subscribe(() => loadAll());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service]);

  const viewport = useViewport();

  const membersById = useMemo(() => new Map((show?.members ?? []).map((m) => [m.id, m])), [show]);
  const currentPicture = show?.pictures.find((p) => p.id === currentPictureId);

  const handleResetSeed = async () => {
    await service.resetSeed();
  };

  if (!show) {
    return <div className={styles.root} />;
  }

  const layoutProps = {
    stageConfig: show.stageConfig,
    songs: show.songs,
    currentSongId,
    currentPicture,
    members: show.members,
    membersById,
    currentMemberId,
    canEdit,
    onChangeMember: setCurrentMemberId,
    onToggleRole: setCanEdit,
    onResetSeed: handleResetSeed,
  };

  return (
    <div className={styles.root}>
      {viewport.layout === "phone" && <PhoneLayout {...layoutProps} />}
      {viewport.layout === "tablet" && <TabletLayout {...layoutProps} />}
      {viewport.layout === "desktop" && <DesktopLayout {...layoutProps} />}
    </div>
  );
}
