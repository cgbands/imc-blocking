import type {
  Mic,
  MicPlacement,
  Picture,
  Prop,
  PropPlacement,
  ShowData,
  Song,
  StageConfig,
} from "../../types";
import { generatePeople } from "./people";
import {
  formationArc,
  formationBlocks,
  formationCircle,
  formationRiserRows,
  formationScatter,
  formationWedge,
} from "./formations";
import { buildRiserGrid, centeredOriginX } from "./riserGrid";
import { mulberry32 } from "./rng";
import type { RiserGridConfig } from "../../types";

const STAGE_WIDTH = 72;
const STAGE_HEIGHT = 42;

// Default: 5 rows x 5 risers across, spread out to fill most of the stage.
// The grid is data-driven (RiserGridConfig) so a later Stage Setup editor
// can offer other configurations (e.g. 6 across) by regenerating `risers`
// from a different config via buildRiserGrid().
const RISER_GRID: RiserGridConfig = {
  rows: 5,
  cols: 5,
  riserWidth: 9,
  riserHeight: 3.4,
  gapX: 1.4,
  gapY: 1.2,
  originX: 0,
  originY: 2,
  stairs: { front: true, back: false, left: true, right: true },
};
RISER_GRID.originX = centeredOriginX(RISER_GRID, STAGE_WIDTH);

const STAGE: StageConfig = {
  width: STAGE_WIDTH,
  height: STAGE_HEIGHT,
  gridSpacingFt: 2,
  snapToGrid: true,
  riserGrid: RISER_GRID,
  risers: buildRiserGrid(RISER_GRID),
  wings: [
    { side: "left", x: -12, y: 0, width: 12, height: STAGE_HEIGHT },
    { side: "right", x: STAGE_WIDTH, y: 0, width: 12, height: STAGE_HEIGHT },
  ],
};

const PROPS: Prop[] = [
  { id: "prop-piano", name: "Piano", kind: "rectangle", color: "#5b4636", width: 6, height: 3 },
  { id: "prop-podium", name: "Center Podium", kind: "square", color: "#7d7d7d", width: 2, height: 2 },
  { id: "prop-stool", name: "Riser Stool", kind: "circle", color: "#b98d5c", width: 1.5, height: 1.5 },
];

const MICS: Mic[] = [
  { id: "mic-1", label: "Mic 1" },
  { id: "mic-2", label: "Mic 2" },
];

function staticProps(overrides?: Partial<Record<string, { x: number; y: number }>>): PropPlacement[] {
  const defaults: Record<string, { x: number; y: number }> = {
    "prop-piano": { x: 8, y: 30 },
    "prop-podium": { x: 32, y: 18 },
    "prop-stool": { x: 54, y: 28 },
  };
  return PROPS.map((prop) => {
    const pos = overrides?.[prop.id] ?? defaults[prop.id];
    return { propId: prop.id, x: pos.x, y: pos.y };
  });
}

function mics(holders: { micId: string; holderMemberId: string | null; x: number; y: number }[]): MicPlacement[] {
  return holders.map((h) => ({ micId: h.micId, holderMemberId: h.holderMemberId, x: h.x, y: h.y }));
}

export function generateShowData(): ShowData {
  const members = generatePeople(106);
  const ids = members.map((m) => m.id);
  const rng = mulberry32(7);

  // The member who never appears in Song 2, to demonstrate the "not in this song" note.
  const absentFromSong2 = ids[55];
  const song2Ids = ids.filter((id) => id !== absentFromSong2);

  // --- Song 1: "Sing, Sing, Sing" — 6 Pictures, full company, one mic handoff. ---
  const song1Ids = ids;
  // Picked from the middle of the roster so both carriers are out on stage
  // (the first few ids are the ones tucked into the wings) and far enough
  // apart that the handoff is easy to watch.
  const holderA = song1Ids[60];
  const holderB = song1Ids[85];

  const song1Pictures: Picture[] = [
    {
      id: "song1-p1",
      songId: "song-1",
      order: 0,
      label: "Opening — riser rows",
      people: formationRiserRows(song1Ids, STAGE, { wingsCount: 4 }),
      props: staticProps(),
      mics: mics([
        { micId: "mic-1", holderMemberId: holderA, x: 20, y: 26 },
        { micId: "mic-2", holderMemberId: null, x: 44, y: 26 },
      ]),
    },
    {
      id: "song1-p2",
      songId: "song-1",
      order: 1,
      label: "Verse — wedge",
      people: formationWedge(song1Ids, STAGE, { wingsCount: 2 }),
      props: staticProps({ "prop-podium": { x: 32, y: 14 } }),
      mics: mics([
        { micId: "mic-1", holderMemberId: holderA, x: 32, y: 32 },
        { micId: "mic-2", holderMemberId: null, x: 44, y: 26 },
      ]),
    },
    {
      id: "song1-p3",
      songId: "song-1",
      order: 2,
      label: "Chorus — circle",
      people: formationCircle(song1Ids, STAGE, { wingsCount: 3 }),
      props: staticProps(),
      // Mic 1 hands off from holderA to holderB here.
      mics: mics([
        { micId: "mic-1", holderMemberId: holderB, x: 30, y: 20 },
        { micId: "mic-2", holderMemberId: null, x: 44, y: 26 },
      ]),
    },
    {
      id: "song1-p4",
      songId: "song-1",
      order: 3,
      label: "Bridge — arc",
      people: formationArc(song1Ids, STAGE, { wingsCount: 6 }),
      props: staticProps({ "prop-stool": { x: 50, y: 24 } }),
      mics: mics([
        { micId: "mic-1", holderMemberId: holderB, x: 34, y: 30 },
        { micId: "mic-2", holderMemberId: null, x: 44, y: 26 },
      ]),
    },
    {
      id: "song1-p5",
      songId: "song-1",
      order: 4,
      label: "Break — scatter",
      people: formationScatter(song1Ids, STAGE, rng, { wingsCount: 5 }),
      props: staticProps(),
      mics: mics([
        { micId: "mic-1", holderMemberId: holderB, x: 26, y: 22 },
        { micId: "mic-2", holderMemberId: null, x: 44, y: 26 },
      ]),
    },
    {
      id: "song1-p6",
      songId: "song-1",
      order: 5,
      label: "Finale — riser rows",
      people: formationRiserRows(song1Ids, STAGE, { wingsCount: 0 }),
      props: staticProps(),
      mics: mics([
        { micId: "mic-1", holderMemberId: holderB, x: 20, y: 26 },
        { micId: "mic-2", holderMemberId: null, x: 44, y: 26 },
      ]),
    },
  ];

  // --- Song 2: "Blue Skies" — 4 Pictures, one member sits this song out entirely. ---
  const song2Pictures: Picture[] = [
    {
      id: "song2-p1",
      songId: "song-2",
      order: 0,
      label: "Opening — two blocks",
      people: formationBlocks(song2Ids, STAGE, { wingsCount: 0 }),
      props: staticProps(),
      mics: mics([
        { micId: "mic-1", holderMemberId: null, x: 12, y: 30 },
        { micId: "mic-2", holderMemberId: null, x: 52, y: 30 },
      ]),
    },
    {
      id: "song2-p2",
      songId: "song-2",
      order: 1,
      label: "Verse — arc",
      people: formationArc(song2Ids, STAGE, { wingsCount: 0 }),
      props: staticProps(),
      mics: mics([
        { micId: "mic-1", holderMemberId: null, x: 12, y: 30 },
        { micId: "mic-2", holderMemberId: null, x: 52, y: 30 },
      ]),
    },
    {
      id: "song2-p3",
      songId: "song-2",
      order: 2,
      label: "Chorus — wedge",
      people: formationWedge(song2Ids, STAGE, { wingsCount: 0 }),
      props: staticProps(),
      mics: mics([
        { micId: "mic-1", holderMemberId: null, x: 12, y: 30 },
        { micId: "mic-2", holderMemberId: null, x: 52, y: 30 },
      ]),
    },
    {
      id: "song2-p4",
      songId: "song-2",
      order: 3,
      label: "Ending — riser rows",
      people: formationRiserRows(song2Ids, STAGE, { wingsCount: 0 }),
      props: staticProps(),
      mics: mics([
        { micId: "mic-1", holderMemberId: null, x: 12, y: 30 },
        { micId: "mic-2", holderMemberId: null, x: 52, y: 30 },
      ]),
    },
  ];

  // --- Song 3: "Home Again" — 3 Pictures, full company. ---
  const song3Ids = ids;
  const song3Pictures: Picture[] = [
    {
      id: "song3-p1",
      songId: "song-3",
      order: 0,
      label: "Opening — circle",
      people: formationCircle(song3Ids, STAGE, { wingsCount: 2 }),
      props: staticProps(),
      mics: mics([
        { micId: "mic-1", holderMemberId: null, x: 20, y: 26 },
        { micId: "mic-2", holderMemberId: null, x: 44, y: 26 },
      ]),
    },
    {
      id: "song3-p2",
      songId: "song-3",
      order: 1,
      label: "Verse — scatter",
      people: formationScatter(song3Ids, STAGE, rng, { wingsCount: 2 }),
      props: staticProps(),
      mics: mics([
        { micId: "mic-1", holderMemberId: null, x: 20, y: 26 },
        { micId: "mic-2", holderMemberId: null, x: 44, y: 26 },
      ]),
    },
    {
      id: "song3-p3",
      songId: "song-3",
      order: 2,
      label: "Finale — riser rows",
      people: formationRiserRows(song3Ids, STAGE, { wingsCount: 0 }),
      props: staticProps(),
      mics: mics([
        { micId: "mic-1", holderMemberId: null, x: 20, y: 26 },
        { micId: "mic-2", holderMemberId: null, x: 44, y: 26 },
      ]),
    },
  ];

  const songs: Song[] = [
    { id: "song-1", title: "Sing, Sing, Sing", order: 0, pictureIds: song1Pictures.map((p) => p.id) },
    { id: "song-2", title: "Blue Skies", order: 1, pictureIds: song2Pictures.map((p) => p.id) },
    { id: "song-3", title: "Home Again", order: 2, pictureIds: song3Pictures.map((p) => p.id) },
  ];

  const pictures = [...song1Pictures, ...song2Pictures, ...song3Pictures];

  return {
    members,
    songs,
    pictures,
    props: PROPS,
    mics: MICS,
    stageConfig: STAGE,
  };
}
