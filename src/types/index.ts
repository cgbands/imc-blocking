export type PersonShape =
  | "circle"
  | "star"
  | "square"
  | "triangle"
  | "diamond"
  | "heart"
  | "spade"
  | "club";

export type VoicePart = "T1" | "T2" | "Bar" | "Bass";
export type DanceGroup = "Dance Line A" | "Dance Line B" | "Dance Line C";

export interface Member {
  id: string;
  name: string;
  voicePart: VoicePart;
  danceGroup: DanceGroup;
  shape: PersonShape;
  color: string;
  tagShape: PersonShape;
  tagColor: string;
}

export interface Point {
  x: number;
  y: number;
}

export type PositionZone = "stage" | "wings-left" | "wings-right";

export interface PersonPlacement extends Point {
  memberId: string;
  zone: PositionZone;
}

export interface PropPlacement extends Point {
  propId: string;
}

export interface MicPlacement extends Point {
  micId: string;
  holderMemberId: string | null;
}

export interface Picture {
  id: string;
  songId: string;
  order: number;
  label: string;
  people: PersonPlacement[];
  props: PropPlacement[];
  mics: MicPlacement[];
}

export interface Song {
  id: string;
  title: string;
  order: number;
  pictureIds: string[];
}

export type PropKind = "rectangle" | "square" | "circle";

export interface Prop {
  id: string;
  name: string;
  kind: PropKind;
  color: string;
  width: number;
  height: number;
}

export interface Mic {
  id: string;
  label: string;
}

export type RiserEdge = "front" | "back" | "left" | "right";

export interface Riser {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  stairEdges: RiserEdge[];
}

export interface WingZone {
  side: "left" | "right";
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface StageConfig {
  width: number;
  height: number;
  gridSpacingFt: 0 | 1 | 2 | 5;
  snapToGrid: boolean;
  risers: Riser[];
  wings: WingZone[];
}

export interface ShowData {
  members: Member[];
  songs: Song[];
  pictures: Picture[];
  props: Prop[];
  mics: Mic[];
  stageConfig: StageConfig;
}
