import { useCallback } from "react";
import { clipStorage } from "@/utils/clipStorage";

export function useSaveClips(
  getChunks: () => { blob: Blob; time: number }[],
  getInitChunk: () => Blob | null,
  mimeType: string,
  requestFlushAndGet: (cb: () => void) => void
) {
  const saveLastSeconds = useCallback(
    (seconds: number, onDone?: (success: boolean) => void) => {
      // First flush any uncommitted buffered data from the recorder,
      // then build the clip. This fixes "videos cut short" by capturing
      // the last partial second that hadn't been committed yet.
      requestFlushAndGet(() => {
        const now = Date.now();
        const cutoff = now - seconds * 1000;
        const chunks = getChunks().filter((c) => c.time >= cutoff);
        const initChunk = getInitChunk();

        if (chunks.length === 0 || !initChunk) {
          onDone?.(false);
          return;
        }

        // Always prepend the init segment so the browser (and Samsung video editor)
        // can decode the video. Without it you get rainbow pixel artifacts and
        // the editor can't determine duration or seek properly.
        const allBlobs = [initChunk, ...chunks.map((c) => c.blob)];
        const blob = new Blob(allBlobs, { type: mimeType || "video/webm" });
        const actualDuration = (now - chunks[0].time) / 1000;
        const clip = clipStorage.save(blob, actualDuration, mimeType || "video/webm");
        onDone?.(true);
        return clip;
      });
    },
    [getChunks, getInitChunk, mimeType, requestFlushAndGet]
  );

  return { saveLastSeconds };
}
