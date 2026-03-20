import { useCallback } from "react";
import { clipStorage } from "@/utils/clipStorage";

export function useSaveClips(
  getChunks: () => { blob: Blob; time: number }[],
  getInitChunk: () => Blob | null,
  mimeType: string
) {
  const saveLastSeconds = useCallback(
    (seconds: number) => {
      const now = Date.now();
      const cutoff = now - seconds * 1000;
      const chunks = getChunks().filter((c) => c.time >= cutoff);
      const initChunk = getInitChunk();

      if (chunks.length === 0 || !initChunk) return null;

      // Always prepend the init segment so the browser can decode the video
      const allBlobs = [initChunk, ...chunks.map((c) => c.blob)];
      const blob = new Blob(allBlobs, { type: mimeType || "video/webm" });
      const actualDuration = (now - chunks[0].time) / 1000;
      return clipStorage.save(blob, actualDuration, mimeType || "video/webm");
    },
    [getChunks, getInitChunk, mimeType]
  );

  return { saveLastSeconds };
}
