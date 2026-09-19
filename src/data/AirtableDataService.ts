import type { DataService } from "./DataService";
import type { Member, Picture, Prop, Mic, Song, StageConfig } from "../types";

/**
 * Stub for the future Airtable-backed implementation. See docs/AIRTABLE.md for
 * the proposed table/field schema and the batching/rate-limit rules to apply
 * once this talks to a real (server-side) Airtable API proxy.
 */
export class AirtableDataService implements DataService {
  constructor(_apiBaseUrl: string) {
    // TODO: store the base URL of the server-side proxy that holds the Airtable token.
  }

  async getMembers(): Promise<Member[]> {
    // TODO: GET /api/members
    throw new Error("AirtableDataService.getMembers not implemented");
  }

  async getSetlist(): Promise<Song[]> {
    // TODO: GET /api/songs
    throw new Error("AirtableDataService.getSetlist not implemented");
  }

  async getPictures(_songId: string): Promise<Picture[]> {
    // TODO: GET /api/songs/:songId/pictures — positions stored as compact JSON, see docs/AIRTABLE.md
    throw new Error("AirtableDataService.getPictures not implemented");
  }

  async getProps(): Promise<Prop[]> {
    // TODO: GET /api/props
    throw new Error("AirtableDataService.getProps not implemented");
  }

  async getMics(): Promise<Mic[]> {
    // TODO: GET /api/mics
    throw new Error("AirtableDataService.getMics not implemented");
  }

  async getStageConfig(): Promise<StageConfig> {
    // TODO: GET /api/stage-config
    throw new Error("AirtableDataService.getStageConfig not implemented");
  }

  async savePicture(_picture: Picture): Promise<void> {
    // TODO: PATCH /api/pictures/:id — batch at most 10 records per Airtable request,
    // and respect Airtable's 5 requests/sec limit (queue + throttle server-side).
    // The server-side handler is also where the editor-role check belongs.
    throw new Error("AirtableDataService.savePicture not implemented");
  }

  async saveSongPictures(_songId: string, _pictures: Picture[]): Promise<void> {
    // TODO: POST /api/songs/:songId/pictures — reorder/add/delete in one batch.
    throw new Error("AirtableDataService.saveSongPictures not implemented");
  }

  async saveStageConfig(_config: StageConfig): Promise<void> {
    // TODO: PATCH /api/stage-config
    throw new Error("AirtableDataService.saveStageConfig not implemented");
  }

  async saveMember(_member: Member): Promise<void> {
    // TODO: PATCH /api/members/:id — shape/colour/tag are member-level, not per-Picture.
    throw new Error("AirtableDataService.saveMember not implemented");
  }

  async saveProps(_props: Prop[]): Promise<void> {
    // TODO: PATCH /api/props (batch of at most 10 per Airtable request)
    throw new Error("AirtableDataService.saveProps not implemented");
  }

  async saveSetlist(_songs: Song[]): Promise<void> {
    // TODO: PATCH /api/songs — song order only.
    throw new Error("AirtableDataService.saveSetlist not implemented");
  }

  async resetSeed(): Promise<void> {
    throw new Error("AirtableDataService.resetSeed is not applicable to a real data source");
  }

  subscribe(_callback: () => void): () => void {
    // TODO: poll or use Airtable webhooks (via the server proxy) to detect remote changes.
    return () => {};
  }
}
