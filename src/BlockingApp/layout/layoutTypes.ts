import type { Member, Mic, MicPlacement, Picture, Prop, PropKind, Song, StageConfig } from "../../types";
import type { SelectionState } from "../editor/useEditor";
import type { TransitionSpeed } from "../playbackSpeed";

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
  transitionSpeed: TransitionSpeed;
  onSetTransitionSpeed: (speed: TransitionSpeed) => void;

  members: Member[];
  membersById: Map<string, Member>;
  propsById: Map<string, Prop>;
  micsById: Map<string, Mic>;
  isolatedMemberId: string | null;
  onSelectPerson: (memberId: string) => void;
  absentSongIds: Set<string>;

  findMeActive: boolean;
  onFindMe: () => void;
  memberInCurrentPicture: boolean;
  highlightedMemberId: string | null;

  currentMemberId: string;
  canEdit: boolean;
  onChangeMember: (id: string) => void;
  onToggleRole: (canEdit: boolean) => void;
  onResetSeed: () => void;
  onEditorLogin: () => void;
  onEditorLogout: () => void;

  /** Editing */
  coarsePointer: boolean;
  selection: SelectionState;
  selectionCount: number;
  onSelectionChange: (selection: SelectionState) => void;
  onMovePeople: (moves: { memberId: string; x: number; y: number }[]) => void;
  onMoveProps: (moves: { propId: string; x: number; y: number }[]) => void;
  onMoveMics: (moves: { micId: string; x: number; y: number }[]) => void;
  onAssignMic: (micId: string, memberId: string | null) => void;
  mics: Mic[];
  micPlacements: MicPlacement[];
  snapValue: (v: number) => number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onAddProp: (kind: PropKind) => void;
  onUpdateProp: (prop: Prop) => void;
  onDeleteProp: (propId: string) => void;
  onUpdateMember: (member: Member) => void;
  onAlign: (mode: "left" | "right" | "top" | "bottom" | "centerX" | "centerY") => void;
  onDistribute: (axis: "x" | "y") => void;
  onDeleteSelection: () => void;
  onDuplicatePicture: (index: number) => void;
  onDeletePicture: (index: number) => void;
  onMovePicture: (index: number, delta: number) => void;
  onMoveSong: (index: number, delta: number) => void;
  onUpdateStageConfig: (config: StageConfig) => void;
  onShowHelp: () => void;
}
