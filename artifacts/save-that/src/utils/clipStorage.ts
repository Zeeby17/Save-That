export interface StoredClip {
  id: string;
  timestamp: Date;
  duration: number;
  size: number;
  blob: Blob;
  mimeType: string;
  url: string;
}

class ClipStorage {
  private clips: Map<string, StoredClip> = new Map();

  save(blob: Blob, duration: number, mimeType: string): StoredClip {
    const id = `clip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const url = URL.createObjectURL(blob);
    const clip: StoredClip = {
      id,
      timestamp: new Date(),
      duration,
      size: blob.size,
      blob,
      mimeType,
      url,
    };
    this.clips.set(id, clip);
    window.dispatchEvent(new CustomEvent("clipSaved", { detail: clip }));
    return clip;
  }

  getAll(): StoredClip[] {
    return Array.from(this.clips.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  get(id: string): StoredClip | undefined {
    return this.clips.get(id);
  }

  delete(id: string): void {
    const clip = this.clips.get(id);
    if (clip) {
      URL.revokeObjectURL(clip.url);
      this.clips.delete(id);
    }
  }

  deleteAll(): void {
    this.clips.forEach((clip) => {
      URL.revokeObjectURL(clip.url);
    });
    this.clips.clear();
  }

  count(): number {
    return this.clips.size;
  }
}

export const clipStorage = new ClipStorage();
