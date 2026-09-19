import type { Member, Picture, Prop, Mic, Song, StageConfig } from "../types";

export interface DataService {
  getMembers(): Promise<Member[]>;
  getSetlist(): Promise<Song[]>;
  getPictures(songId: string): Promise<Picture[]>;
  getProps(): Promise<Prop[]>;
  getMics(): Promise<Mic[]>;
  getStageConfig(): Promise<StageConfig>;
  savePicture(picture: Picture): Promise<void>;
  saveStageConfig(config: StageConfig): Promise<void>;
  resetSeed(): Promise<void>;
  subscribe(callback: () => void): () => void;
}
