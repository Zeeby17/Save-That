import { useCallback } from "react";
import { clipStorage } from "@/utils/clipStorage";
// @ts-ignore — no types for this package
import fixWebmDuration from "fix-webm-duration";

export function useSaveClips(
  getChunks: () => { blob: Blob; time: number }[],
  getInitChunk: () => Blob | null,
  mimeType: string,
  requestFlushAndGet: (cb: () => void) => void
) {
  const saveLastSeconds = useCallback(
    (seconds: number, onDone?: (success: boolean) => void) => {
      requestFlushAndGet(async () => {
        const now = Date.now();
        const cutoff = now - seconds * 1000;
        const chunks = getChunks().filter((c) => c.time >= cutoff);
        const initChunk = getInitChunk();

        if (chunks.length === 0 || !initChunk) {
          onDone?.(false);
          return;
        }

        const actualDuration = (now - chunks[0].time) / 1000;
        const allBlobs = [initChunk, ...chunks.map((c) => c.blob)];
        let blob = new Blob(allBlobs, { type: mimeType || "video/webm" });

        // Fix WebM duration metadata so Samsung Gallery / native editors
        // show the correct time and allow trimming/editing
        if (blob.type.includes("webm")) {
          try {
            blob = await fixWebmDuration(blob, actualDuration * 1000);
          } catch {
            // If fix fails, continue with the original blob
          }
        }

        clipStorage.save(blob, actualDuration, mimeType || "video/webm");
        onDone?.(true);
      });
    },
    [getChunks, getInitChunk, mimeType, requestFlushAndGet]
  );

  return { saveLastSeconds };
}
