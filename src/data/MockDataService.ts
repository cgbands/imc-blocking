import type { DataService } from "./DataService";
import type { Member, Picture, Prop, Mic, Song, StageConfig, ShowData } from "../types";
import { generateShowData } from "./seed/show";

const STORAGE_KEY = "imc-blocking:show-data:v1";

function load(): ShowData {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as ShowData;
    } catch {
      // fall through to regenerate
    }
  }
  const fresh = generateShowData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  return fresh;
}

function save(data: ShowData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export class MockDataService implements DataService {
  private data: ShowData;
  private listeners = new Set<() => void>();

  constructor() {
    this.data = load();
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  async getMembers(): Promise<Member[]> {
    return this.data.members;
  }

  async getSetlist(): Promise<Song[]> {
    return this.data.songs;
  }

  async getPictures(songId: string): Promise<Picture[]> {
    return this.data.pictures.filter((p) => p.songId === songId).sort((a, b) => a.order - b.order);
  }

  async getProps(): Promise<Prop[]> {
    return this.data.props;
  }

  async getMics(): Promise<Mic[]> {
    return this.data.mics;
  }

  async getStageConfig(): Promise<StageConfig> {
    return this.data.stageConfig;
  }

  async savePicture(picture: Picture): Promise<void> {
    const idx = this.data.pictures.findIndex((p) => p.id === picture.id);
    if (idx >= 0) this.data.pictures[idx] = picture;
    else this.data.pictures.push(picture);
    save(this.data);
    this.notify();
  }

  async saveSongPictures(songId: string, pictures: Picture[]): Promise<void> {
    const others = this.data.pictures.filter((p) => p.songId !== songId);
    this.data.pictures = [...others, ...pictures.map((p, i) => ({ ...p, order: i }))];
    const song = this.data.songs.find((s) => s.id === songId);
    if (song) song.pictureIds = pictures.map((p) => p.id);
    save(this.data);
    this.notify();
  }

  async saveStageConfig(config: StageConfig): Promise<void> {
    this.data.stageConfig = config;
    save(this.data);
    this.notify();
  }

  async saveMember(member: Member): Promise<void> {
    const idx = this.data.members.findIndex((m) => m.id === member.id);
    if (idx >= 0) this.data.members[idx] = member;
    save(this.data);
    this.notify();
  }

  async saveProps(props: Prop[]): Promise<void> {
    this.data.props = props;
    save(this.data);
    this.notify();
  }

  async saveSetlist(songs: Song[]): Promise<void> {
    this.data.songs = songs.map((s, i) => ({ ...s, order: i }));
    save(this.data);
    this.notify();
  }

  async resetSeed(): Promise<void> {
    this.data = generateShowData();
    save(this.data);
    this.notify();
  }

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
}
