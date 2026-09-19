# IMC Blocking (prototype)

Interactive stage-blocking tool prototype for Indianapolis Men's Chorus. Standalone
today; built so it can later mount as `<BlockingApp />` inside the member portal with
Airtable as the data source (see [`docs/AIRTABLE.md`](docs/AIRTABLE.md), coming in a
later phase).

**Status: Phase 1 of 6** — responsive glass/bento shell, 106-person seeded stage,
pinch/pan/wheel zoom, PWA basics. No song/Picture navigation, editing, mics, or Find Me
yet — those land in later phases.

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

## Concepts

- **Setlist** → ordered **Songs** → ordered **Pictures**. A Picture is the position of
  every person, prop, and mic at one moment.
- **Wings**: people in the wings zones (drawn beside the main stage) are off-stage but
  still considered part of the Picture — they're just not physically on the risers/floor.

## Project layout

- `src/BlockingApp/` — the whole tool, as one self-contained component
  (`BlockingApp.tsx`) that takes `currentMemberId` / `canEdit` props.
- `src/data/` — `DataService` interface, `MockDataService` (localStorage + seeded
  data), and an `AirtableDataService` stub for later.
- `src/data/seed/` — deterministic mock-data generators (people, formations, the show).
