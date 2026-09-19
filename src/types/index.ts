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

/**
 * Describes a grid of individual riser blocks (rows x cols). `risers` on
 * StageConfig is the generated, renderable Riser[]; this is the editable
 * source config a future Stage Setup editor (Phase 3) would expose as
 * number inputs and use to regenerate `risers`.
 */
export interface RiserGridConfig {
  rows: number;
  cols: number;
  riserWidth: number;
  riserHeight: number;
  gapX: number;
  gapY: number;
  /** top-left of the grid's first (furthest upstage) row */
  originX: number;
  originY: number;
  /** which edges of the grid perimeter have stairs */
  stairs: Record<RiserEdge, boolean>;
}

export interface StageConfig {
  width: number;
  height: number;
  gridSpacingFt: 0 | 1 | 2 | 5;
  snapToGrid: boolean;
  riserGrid: RiserGridConfig;
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
