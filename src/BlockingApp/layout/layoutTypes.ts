import type { Member, Mic, Picture, Prop, Song, StageConfig } from "../../types";

export interface LayoutProps {
  stageConfig: StageConfig;
  songs: Song[];
  currentSongId: string | null;
  onSelectSong: (songId: string) => void;

  songPictures: Picture[];
  currentPicture: Picture | undefined;
  nextPicture: Picture | null;
  progress: number;
  isPlaying: boolean;
  isAnimating: boolean;
  playerIndex: number;
  canStepPrev: boolean;
  canStepNext: boolean;
  onPlayPause: () => void;
  onStepPrev: () => void;
  onStepNext: () => void;
  onScrub: (value: number) => void;
  onJumpToPicture: (index: number) => void;
  showTrails: boolean;
  onToggleTrails: (value: boolean) => void;
  showNames: boolean;
  onToggleNames: (value: boolean) => void;

  members: Member[];
  membersById: Map<string, Member>;
  propsById: Map<string, Prop>;
  micsById: Map<string, Mic>;
  isolatedMemberId: string | null;
  onSelectPerson: (memberId: string) => void;

  currentMemberId: string;
  canEdit: boolean;
  onChangeMember: (id: string) => void;
  onToggleRole: (canEdit: boolean) => void;
  onResetSeed: () => void;
  onEditorLogin: () => void;
  onEditorLogout: () => void;
}
