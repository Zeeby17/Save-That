import { useCallback } from "react";
import { clipStorage } from "@/utils/clipStorage";

export function useSaveClips(
  getChunks: () => { blob: Blob; time: number }[],
  mimeType: string
) {
  const saveLastSeconds = useCallback(
    (seconds: number) => {
      const now = Date.now();
      const cutoff = now - seconds * 1000;
      const chunks = getChunks().filter((c) => c.time >= cutoff);

      if (chunks.length === 0) return null;

      const blob = new Blob(chunks.map((c) => c.blob), {
        type: mimeType || "video/webm",
      });
      const actualDuration = (now - chunks[0].time) / 1000;
      return clipStorage.save(blob, actualDuration, mimeType || "video/webm");
    },
    [getChunks, mimeType]
  );

  return { saveLastSeconds };
}
