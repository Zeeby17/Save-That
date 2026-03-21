import { useCallback } from "react";
import { clipStorage } from "@/utils/clipStorage";
// @ts-ignore — no types for this package
import fixWebmDuration from "fix-webm-duration";

export function useSaveClips(
  getChunks: () => { blob: Blob; time: number }[],
  getInitChunk: () => Blob | null,
  mimeType: string,
  requestFlushAndGet: (cb: () => void) => void,
  getRecordingStart?: () => number
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

        // Calculate actual clip duration from chunk timestamps.
        // Add 500ms for the init chunk's worth of data.
        const recordingStart = getRecordingStart?.() ?? 0;
        const chunkSpan = chunks.length > 0
          ? (now - chunks[0].time + 500) / 1000   // from oldest selected chunk to now
          : seconds;
        // Cap to requested seconds to avoid reporting more than was asked for
        const actualDuration = Math.min(seconds, chunkSpan);

        const allBlobs = [initChunk, ...chunks.map((c) => c.blob)];
        let blob = new Blob(allBlobs, { type: mimeType || "video/webm" });

        // Fix WebM duration metadata so gallery apps (Samsung, iOS Files) show the
        // correct duration and allow scrubbing/editing.
        if (blob.type.includes("webm")) {
          try {
            // Use the requested seconds as duration hint — most accurate for user intent
            blob = await fixWebmDuration(blob, seconds * 1000);
          } catch (e) {
            console.warn("fixWebmDuration failed, using raw blob:", e);
          }
        }

        clipStorage.save(blob, actualDuration, mimeType || "video/webm");
        onDone?.(true);

        // Suppress unused variable warning
        void recordingStart;
      });
    },
    [getChunks, getInitChunk, mimeType, requestFlushAndGet, getRecordingStart]
  );

  return { saveLastSeconds };
}
