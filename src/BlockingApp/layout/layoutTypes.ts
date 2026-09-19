import type { Member, Picture, Song, StageConfig } from "../../types";

export interface LayoutProps {
  stageConfig: StageConfig;
  songs: Song[];
  currentSongId: string | null;
  currentPicture: Picture | undefined;
  members: Member[];
  membersById: Map<string, Member>;
  currentMemberId: string;
  canEdit: boolean;
  onChangeMember: (id: string) => void;
  onToggleRole: (canEdit: boolean) => void;
  onResetSeed: () => void;
}
