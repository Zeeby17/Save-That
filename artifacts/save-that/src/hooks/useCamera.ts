import { useRef, useState, useCallback, useEffect } from "react";

export type VideoQuality = "420p" | "720p" | "1080p" | "4K";
export type CropMode = "full" | "landscape" | "portrait" | "16:9" | "4:3" | "1:1";

const QUALITY_CONSTRAINTS: Record<VideoQuality, { width: number; height: number }> = {
  "420p": { width: 640, height: 480 },
  "720p": { width: 1280, height: 720 },
  "1080p": { width: 1920, height: 1080 },
  "4K": { width: 3840, height: 2160 },
};

// Prefer MP4 on Android (Samsung, Pixel, etc.) for native video editor compatibility.
// WebM is fine for desktop Chrome but breaks Samsung's editor.
function detectMimeType(): string {
  const isAndroid = /Android/i.test(navigator.userAgent);
  const androidFirst = [
    "video/mp4;codecs=avc1,mp4a.40.2",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  const desktopFirst = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=h264,opus",
    "video/webm",
    "video/mp4",
  ];
  const order = isAndroid ? androidFirst : desktopFirst;
  for (const type of order) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

export function useCamera(bufferSeconds = 600) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // First chunk = codec init/header segment — must be prepended to every saved clip
  const initChunkRef = useRef<Blob | null>(null);
  const chunksRef = useRef<{ blob: Blob; time: number }[]>([]);
  const flushCallbackRef = useRef<(() => void) | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [quality, setQuality] = useState<VideoQuality>("720p");
  const [cropMode, setCropMode] = useState<CropMode>("full");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [mimeType, setMimeType] = useState("");
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCamera = useCallback(
    async (fm: "environment" | "user" = facingMode, q: VideoQuality = quality) => {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
        }

        const constraints = QUALITY_CONSTRAINTS[q];
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: fm,
            width: { ideal: constraints.width },
            height: { ideal: constraints.height },
            frameRate: { ideal: 30 },
          },
          audio: true,
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const mime = detectMimeType();
        setMimeType(mime);

        const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : {});
        mediaRecorderRef.current = recorder;
        chunksRef.current = [];
        initChunkRef.current = null;

        let isFirstChunk = true;
        recorder.ondataavailable = (e) => {
          if (!e.data || e.data.size === 0) return;
          const now = Date.now();

          if (isFirstChunk) {
            // The very first chunk contains codec/container headers.
            // Store it separately — it must be prepended to every saved clip
            // or the video will be undecodable (rainbow artifacts, seek failures).
            initChunkRef.current = e.data;
            isFirstChunk = false;
          } else {
            chunksRef.current.push({ blob: e.data, time: now });
            // Trim buffer to the configured max duration
            const cutoff = now - bufferSeconds * 1000;
            chunksRef.current = chunksRef.current.filter((c) => c.time >= cutoff);
          }

          // If something is waiting for the next flush (save action), call it
          if (flushCallbackRef.current) {
            const cb = flushCallbackRef.current;
            flushCallbackRef.current = null;
            cb();
          }
        };

        // 500ms timeslice = 2 chunks/sec = smaller corruption window than 1s,
        // and more keyframe opportunities for clean clip boundaries
        recorder.start(500);
        setIsRecording(true);
        setError(null);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Camera access denied";
        setError(message);
        setIsRecording(false);
      }
    },
    [facingMode, quality, bufferSeconds]
  );

  const stopCamera = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const switchCamera = useCallback(() => {
    const newFacing = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newFacing);
    startCamera(newFacing, quality);
  }, [facingMode, quality, startCamera]);

  const changeQuality = useCallback(
    (q: VideoQuality) => {
      setQuality(q);
      startCamera(facingMode, q);
    },
    [facingMode, startCamera]
  );

  // Flush any uncommitted data then call back — solves "videos cut short" issue.
  // MediaRecorder buffers up to timeslice ms of data. Calling requestData()
  // forces it to fire ondataavailable immediately with whatever it has.
  const requestFlushAndGet = useCallback(
    (onFlushed: () => void) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state !== "recording") {
        onFlushed();
        return;
      }
      flushCallbackRef.current = onFlushed;
      recorder.requestData();
      // Safety fallback in case requestData doesn't fire (shouldn't happen)
      setTimeout(() => {
        if (flushCallbackRef.current) {
          flushCallbackRef.current = null;
          onFlushed();
        }
      }, 300);
    },
    []
  );

  const getChunks = useCallback(() => chunksRef.current, []);
  const getInitChunk = useCallback(() => initChunkRef.current, []);
  const getStream = useCallback(() => streamRef.current, []);

  useEffect(() => {
    startCamera();
    return () => { stopCamera(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isRecording) {
      setElapsedSeconds(0);
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRecording]);

  return {
    videoRef,
    isRecording,
    facingMode,
    quality,
    setQuality: changeQuality,
    cropMode,
    setCropMode,
    switchCamera,
    elapsedSeconds,
    mimeType,
    error,
    getChunks,
    getInitChunk,
    getStream,
    requestFlushAndGet,
    startCamera,
    stopCamera,
  };
}
