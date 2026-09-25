# Airtable data source (proposed)

This is a design document, not working code. Nothing here is implemented —
`src/data/AirtableDataService.ts` is a stub whose methods throw. It exists so
the shape of the future integration is clear and so `DataService` (the
interface both it and `MockDataService` implement) doesn't need to change
shape when the real thing gets built.

## Why server-side

The Airtable API token must never reach the browser. All calls in this
document assume a thin server-side proxy — a few REST endpoints that hold
the token, talk to Airtable, and enforce the rules below — sitting between
`AirtableDataService` and Airtable itself. `AirtableDataService`'s `fetch()`
calls go to that proxy (see the `TODO: GET/PATCH /api/...` comments already
in the stub), never to `api.airtable.com` directly. This is also where the
editor-role check belongs: `canEdit` in the app is a UI guard only, so every
write endpoint on the proxy must independently verify the caller is allowed
to edit before touching Airtable.

## Table schema

Six tables, matching the six top-level collections in `ShowData`
(`src/types/index.ts`). Airtable record IDs (`rec...`) are the natural
primary key; the app-level `id` strings used throughout the client
(`m-1`, `song-1`, `song1-p3`, ...) become a plain text **Slug** field kept in
sync for readability in the Airtable UI and for stable foreign-key-style
links from Pictures — using the record ID directly as the link target is
also fine and is what an Airtable "Link to another record" field does
natively, but a human-readable Slug makes debugging the base much easier.

### Members

One row per chorus member. Shape/colour/tag live here, not per-Picture,
matching `Member` — they're a property of the person, not of a moment.

| Field | Type | Notes |
|---|---|---|
| Name | Single line text | |
| Slug | Single line text | e.g. `m-42`; unique |
| Voice Part | Single select | `T1` / `T2` / `Bar` / `Bass` |
| Dance Group | Single select | `Dance Line A` / `B` / `C` |
| Shape | Single select | the 8 `PersonShape` values |
| Color | Single line text | hex string |
| Tag Shape | Single select | same 8 values |
| Tag Color | Single line text | hex string |

### Songs

One row per song in the setlist.

| Field | Type | Notes |
|---|---|---|
| Title | Single line text | |
| Slug | Single line text | e.g. `song-2`; unique |
| Order | Number | integer, defines setlist order |
| Pictures | Link to another record → Pictures | Airtable's own link field already gives ordering-by-link-order for free, but see **Ordering** below for why `Order` fields are kept explicit anyway |

### Pictures

One row per Picture. This is the only table where per-moment position data
lives, and it's the one the batching/rate-limit rules matter most for,
since every drag in the editor is a write here.

| Field | Type | Notes |
|---|---|---|
| Label | Single line text | e.g. "Chorus — circle" |
| Slug | Single line text | e.g. `song1-p3`; unique |
| Song | Link to another record → Songs | |
| Order | Number | integer, position within the song |
| People JSON | Long text | compact JSON, see **Positions as compact JSON** |
| Props JSON | Long text | compact JSON |
| Mics JSON | Long text | compact JSON |

### Props

One row per prop (piano, podium, riser stool, ...). Static properties only —
per-Picture position lives in each Picture's `Props JSON`, same as people.

| Field | Type | Notes |
|---|---|---|
| Name | Single line text | |
| Slug | Single line text | unique |
| Kind | Single select | `rectangle` / `square` / `circle` |
| Color | Single line text | hex string |
| Width | Number | feet, decimal |
| Height | Number | feet, decimal |

### Mics

One row per mic. Just an identity — position and who's holding it are
per-Picture state, same as everything else that moves.

| Field | Type | Notes |
|---|---|---|
| Label | Single line text | e.g. "Mic 1" |
| Slug | Single line text | unique |

### Stage Config

A **single-row** table (the app only ever needs one active stage layout).
Mirrors `StageConfig` flatly rather than nesting `RiserGridConfig` as JSON,
since these are exactly the fields a Stage Setup–style admin view in
Airtable itself would want to edit directly.

| Field | Type | Notes |
|---|---|---|
| Width | Number | feet |
| Height | Number | feet |
| Grid Spacing Ft | Single select | `0` / `1` / `2` / `5` |
| Snap To Grid | Checkbox | |
| Riser Rows | Number | |
| Riser Cols | Number | |
| Riser Width | Number | feet |
| Riser Height | Number | feet |
| Riser Gap X | Number | feet |
| Riser Gap Y | Number | feet |
| Riser Origin X | Number | feet |
| Riser Origin Y | Number | feet |
| Stairs Front | Checkbox | |
| Stairs Back | Checkbox | |
| Stairs Left | Checkbox | |
| Stairs Right | Checkbox | |
| Wing Width | Number | feet; both wings share one width today ( `StageConfig.wings[0].width` ) |

`risers: Riser[]` itself is **not** stored — it's derived, generated
client-side by `buildRiserGrid()` (`src/data/seed/riserGrid.ts`) from the
Riser Rows/Cols/Width/Height/Gap/Origin/Stairs fields above, exactly as it
is today from `RiserGridConfig`. Same for `wings[].x`/`.height`, which are
derived from Width/Height/Wing Width. Storing only the source config and
deriving the rest keeps this Airtable-facing schema exactly as wide as the
one already proven out in `MockDataService`.

## Positions as compact JSON

`Picture.people` / `.props` / `.mics` stay JSON blobs in Airtable rather
than becoming their own linked tables (e.g. a "Placements" table with one
row per person per Picture). At 106 people × 6+ Pictures per song × 3+
songs, a normalized table would be several thousand rows for placements
alone, well past what's pleasant to page through in Airtable's UI or fetch
efficiently through its API — and a Picture's entire placement set is
always read and written together (never one row at a time), so there's no
query pattern that benefits from normalizing it.

The JSON is the same shape already used in-memory
(`PersonPlacement[]` / `PropPlacement[]` / `MicPlacement[]`, `src/types/index.ts`),
serialized with short keys to keep the payload down:

```json
// People JSON
[{"id":"m-42","x":12.5,"y":8,"zone":"stage"}, ...]

// Props JSON
[{"id":"prop-piano","x":8,"y":30}, ...]

// Mics JSON
[{"id":"mic-1","x":20,"y":26,"holder":"m-42"}, ...]
```

(`id`/`x`/`y`/`zone`/`holder` map to `memberId|propId|micId`/`x`/`y`/`zone`/
`holderMemberId` — renamed short here since this blob is pure payload, never
directly edited by a human in the Airtable UI the way the other fields are.)

`AirtableDataService.getPictures()` parses these three fields back into the
shape `Picture` already expects; `savePicture()` / `saveSongPictures()`
serialize them back down before sending.

## Batching and rate limits

Airtable's REST API caps a single write request at **10 records** and the
base overall at **5 requests/second**. Both rules are enforced **server-side**,
in the proxy — the browser never talks to Airtable directly, so it can't be
the thing responsible for honoring Airtable's limits.

- **Batch of 10**: `saveSongPictures()` can touch every Picture in a song
  at once (reorder, add, delete) — the proxy's handler for that endpoint
  chunks the Picture list into groups of ≤10 and issues one Airtable PATCH
  per chunk, in order.
- **5 req/sec**: the proxy queues outgoing Airtable requests (across all
  concurrent editors, not per-request) and drains the queue at ≤5/sec — a
  simple token-bucket limiter is enough; the volumes here are small (a
  handful of editors, occasional writes) so nothing fancier is needed.
- **Single-object writes** (`savePicture`, `saveMember`, `saveStageConfig`)
  are always exactly one Airtable record write, so they never need chunking
  — they still go through the same rate-limited queue as everything else,
  since the 5/sec cap is base-wide, not per-endpoint.

## Live updates (`subscribe`)

`DataService.subscribe()` needs *something* to notice a remote change (a
co-editor's edit) and refresh. Airtable has no first-party push/websocket
API for row-level changes on the free/plus tiers, so the realistic options,
in order of preference:

1. **Polling**: the proxy exposes a cheap `GET /api/version` (e.g. the max
   `Last Modified` timestamp across the relevant tables) and the client
   polls it every few seconds, only re-fetching the affected resource on
   a change. Simple, no server-side webhook plumbing, and at this app's
   scale (a handful of concurrent editors) the polling volume is trivial.
2. **Airtable webhooks** (available on paid plans): the proxy registers a
   webhook, receives change notifications server-side, and forwards them
   to connected clients over SSE or a WebSocket it already owns. Lower
   latency, more moving parts — worth it only if polling's few-second lag
   turns out to matter in practice.

Either way this is entirely a proxy-side concern; `AirtableDataService`'s
`subscribe()` just wires up to whichever transport the proxy exposes.

## What stays client-side

Seed generation (`src/data/seed/`), `MockDataService`, and the
`localStorage` persistence it uses are prototype-only and have no Airtable
equivalent — they simply stop being used once `AirtableDataService` is
wired up in `BlockingApp`'s `dataService` prop. Nothing else in the app
changes: every component already goes through the `DataService` interface,
never `MockDataService` directly, which is the whole point of that
boundary.
