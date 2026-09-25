# IMC Blocking (prototype)

Interactive stage-blocking tool prototype for Indianapolis Men's Chorus. Standalone
today; built so it can later mount as `<BlockingApp />` inside the member portal with
Airtable as the data source (see [`docs/AIRTABLE.md`](docs/AIRTABLE.md), coming in a
later phase).

**Status: Phase 5 of 6** — responsive glass/bento shell, 106-person seeded stage,
pinch/pan/wheel zoom, PWA basics, setlist/Picture navigation with play/pause,
scrubbing and animated transitions, a full editor (drag, multi-select,
align/distribute, props, stage/riser setup, undo/redo, keyboard shortcuts),
mic hold/handoff/placement, Find Me, and attendance notes. Phase 6 is the
performance/polish pass and `docs/AIRTABLE.md`.

## Run it

```bash
npm install
npm run dev
```

This starts Vite bound to your network (`--host`); the terminal prints both a
`localhost` URL and a LAN URL like `http://192.168.x.x:5173`.

- **Computer**: open the `localhost` URL.
- **iPhone / iPad**: make sure the device is on the same Wi-Fi network as this
  computer, then open the printed LAN URL in Safari.

## Add to Home Screen (PWA)

Once it's open in Safari on iPhone/iPad:

1. Tap the Share icon.
2. Tap **Add to Home Screen**.
3. Launch it from the Home Screen icon — it runs full-screen, without Safari's
   address bar.

(The placeholder icons and app name will be replaced with real branding later.)

## Build for deployment

```bash
npm run build
npm run preview   # local production smoke test
```

`npm run build` produces a static `dist/` folder deployable as-is to Vercel or
Netlify (no server-side code required for this prototype).

## Data

All data is mock/seeded (106 people, a 3-song setlist, formations, mics, and props),
persisted to `localStorage` so it survives reloads. Open the collapsed **Dev** panel
(top-right on tablet/desktop, top bar on phone) to switch the "logged-in" member,
toggle Viewer/Editor, or reset the seed data back to its generated defaults.

## Editor access

**Editor Login** (top bar) is the real, user-facing way to switch into edit mode —
enter the demo passcode `director`. This is separate from the **Dev** panel above,
which is scaffolding for testing (switching identities, resetting seed data) and is
built to be trivial to delete later. Neither is real auth — per the project's
non-goals, there's no server-side check yet; `canEdit` is a prop so it's clear where
that check will go once this mounts in the real portal.

## Editing

Log in as an editor and you get a toolbar above the stage plus an Inspector panel:

- **Move people**: drag them. Drag on empty stage to marquee-select a group;
  Shift/Cmd-click to add or remove one. Arrow keys nudge (Shift = further).
- **Align / distribute**: select 2+ (3+ to distribute) and use the toolbar.
- **Props**: add a rectangle, square, or circle, drag to place it, and use the
  Inspector to rename, recolour, resize, or delete it. A new prop is placed in
  every Picture of the current song, then positioned per Picture.
- **People styling**: shape, colour, and tag belong to the *person*, so changing
  them in the Inspector applies across every Picture.
- **Pictures**: reorder, duplicate, or delete from the Pictures list; songs
  reorder from the Setlist.
- **Stage setup**: quick presets (No risers / 3×3 / 5×5 / 6×6) or full control
  over riser rows/columns/size/gaps, which perimeter edges have stairs, stage
  size, grid spacing (off / 1 / 2 / 5 ft) and snap-to-grid. The grid itself
  only renders in edit mode — it's a staging aid, not something the cast sees.
- **Mics**: select a person and use the Inspector's Mics section to hand a mic
  to them, hand it off from whoever has it, or put it down. A mic nobody is
  holding can be dragged anywhere (including onto a mic-stand spot).
- **Colour**: shape/tag/prop colour pickers have a curated swatch row plus a
  native colour input for anything outside it.
- **Wings**: dropping someone in the wings snaps them into the next open slot
  in that side's queue (matching the seeded layout) instead of leaving gaps —
  so the wings always read as a tidy line, not scattered icons.
- **Undo/redo**: Cmd/Ctrl+Z and Cmd/Ctrl+Shift+Z. Press `?` for the full
  shortcut list.

Every edit funnels through `apply()` in `src/BlockingApp/editor/useEditor.ts`,
which calls the `DataService`. `canEdit` is a UI guard only — the server-side
role check belongs behind those `DataService` calls once this talks to a real
backend.

## Find Me and attendance

**Find Me** (every device) highlights the current member's icon with a pulsing
ring and pans/zooms the stage to them — pressing it again zooms back out. If
they're not in the current Picture, the button shows "You're not in this
picture" instead of moving the camera. While active, the camera keeps
following them as you step, scrub, or play through Pictures, including mid-
transition. Switching songs or "logged-in member" (Dev panel) turns Find Me
off, since the target it was tracking is no longer the current context.

The same "You're not in this picture" note also always shows in the Pictures
panel (not just after pressing Find Me), and the Setlist marks any song the
current member is in zero Pictures of with "You're not in this song."

**Transition speed**: Slow / Normal / Fast chips next to the Pictures list
control how long a Picture-to-Picture transition takes; the choice persists
across reloads.

## Stage / risers

The default stage is a 5-rows-by-5-risers grid (`RISER_GRID` in
`src/data/seed/show.ts`), generated by `buildRiserGrid()` from a plain
`{ rows, cols, riserWidth, riserHeight, gapX, gapY }` config — so other
configurations (6 across, deeper rows, etc.) are a one-line change today, and a
future Stage Setup editor (Phase 3) can expose the same config as number inputs.

## Concepts

- **Setlist** → ordered **Songs** → ordered **Pictures**. A Picture is the position of
  every person, prop, and mic at one moment.
- **Wings**: people in the wings zones (drawn beside the main stage) are off-stage but
  still considered part of the Picture — they're just not physically on the risers/floor.
- **Mics**: a mic is an independent object. While someone holds it, its position is
  *derived* from that person's icon, so it follows them through transitions for free.
  A handoff eases the mic from the giver to the taker while both are still moving.
  Mic changes apply from the current Picture forward, since a mic doesn't jump back
  to a previous carrier.

## Stage hit-testing and tap accuracy

Tapping a person resolves to whichever icon is *nearest* the tap point within
a fixed on-screen radius (44px, converted to feet at the current zoom) —
not whichever overlapping hit-circle the browser's native hit test happened
to pick, which in a packed riser row is unpredictable and often wrong. This
also means a tiny, tightly-zoomed-out icon always keeps a real 44px+ touch
target regardless of how small it renders.

All screen-to-stage coordinate conversion (this hit-testing, drag, marquee
select, and wheel/pinch zoom centering) goes through one `getStageFit()`
helper in `StageCanvas.tsx` that replicates the SVG's own
`preserveAspectRatio="xMidYMid meet"` fit math from state we already hold.
Earlier code computed it naively from `clientWidth / viewBoxWidth`, which
is only correct when the container's aspect ratio happens to match the
stage's — otherwise the SVG letterboxes, and that naive math silently
drifts taps, drags, and zoom-centering away from the actual cursor
position, worse the more the aspect ratios diverge (so worst on a phone
in portrait, viewing a wide stage). Fixed for good in this pass.

## Project layout

- `src/BlockingApp/` — the whole tool, as one self-contained component
  (`BlockingApp.tsx`) that takes `currentMemberId` / `canEdit` props.
- `src/data/` — `DataService` interface, `MockDataService` (localStorage + seeded
  data), and an `AirtableDataService` stub for later.
- `src/data/seed/` — deterministic mock-data generators (people, formations, riser
  grid, the show).
