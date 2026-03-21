import { useRef, useState, useCallback, useEffect } from "react";

export type VideoQuality = "420p" | "720p" | "1080p" | "4K";
export type CropMode = "full" | "landscape" | "portrait" | "16:9" | "4:3" | "1:1";

const QUALITY_CONSTRAINTS: Record<VideoQuality, { width: number; height: number }> = {
  "420p": { width: 640, height: 480 },
  "720p": { width: 1280, height: 720 },
  "1080p": { width: 1920, height: 1080 },
  "4K": { width: 3840, height: 2160 },
};

function detectMimeType(): string {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

// Draw "SAVE THAT" brand watermark directly onto a canvas context at 50% opacity.
// This burns the watermark into the recorded video — like TikTok/Instagram logos.
function drawWatermark(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.globalAlpha = 0.5;

  const bw = 154, bh = 40;
  // Badge background
  ctx.fillStyle = "rgba(15, 0, 40, 0.72)";
  ctx.beginPath();
  (ctx as CanvasRenderingContext2D & { roundRect: (...args: unknown[]) => void })
    .roundRect(x, y, bw, bh, 9);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 140, 0, 0.5)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Hourglass shape
  const hx = x + 8, hy = y + 4;
  ctx.fillStyle = "#FF8C00";
  // Top cap
  ctx.fillRect(hx - 1, hy, 20, 4);
  // Bottom cap
  ctx.fillRect(hx - 1, hy + 28, 20, 4);
  // Top sand triangle
  ctx.beginPath();
  ctx.moveTo(hx, hy + 4);
  ctx.lineTo(hx + 18, hy + 4);
  ctx.lineTo(hx + 9, hy + 16);
  ctx.closePath();
  ctx.fillStyle = "#FFB800";
  ctx.fill();
  // Bottom sand triangle
  ctx.beginPath();
  ctx.moveTo(hx, hy + 28);
  ctx.lineTo(hx + 18, hy + 28);
  ctx.lineTo(hx + 9, hy + 17);
  ctx.closePath();
  ctx.fill();
  // Sand stream
  ctx.strokeStyle = "#FF6600";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(hx + 9, hy + 16);
  ctx.lineTo(hx + 9, hy + 17);
  ctx.stroke();

  // "SAVE THAT" text
  ctx.font = "bold 16px Impact, Arial Black, sans-serif";
  ctx.strokeStyle = "rgba(255,140,0,0.8)";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#6A0DAD";
  ctx.strokeText("SAVE THAT", x + 34, y + 27);
  ctx.fillText("SAVE THAT", x + 34, y + 27);

  ctx.restore();
}

export function useCamera(bufferSeconds = 600) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pipVideoRef = useRef<HTMLVideoElement | null>(null);
  const recordingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pipStreamRef = useRef<MediaStream | null>(null);
  const initChunkRef = useRef<Blob | null>(null);
  const chunksRef = useRef<{ blob: Blob; time: number }[]>([]);
  const flushCallbackRef = useRef<(() => void) | null>(null);

  const isTimeLapseRef = useRef(false);
  const isDualCamRef = useRef(false);

  const [isRecording, setIsRecording] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [quality, setQuality] = useState<VideoQuality>("720p");
  const [cropMode, setCropMode] = useState<CropMode>("full");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [mimeType, setMimeType] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isTimeLapse, setIsTimeLapse] = useState(false);
  const [isDualCam, setIsDualCam] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopDrawLoop = useCallback(() => {
    if (drawIntervalRef.current) {
      clearInterval(drawIntervalRef.current);
      drawIntervalRef.current = null;
    }
  }, []);

  // Start drawing camera frames to the recording canvas with watermark burned in.
  const startDrawLoop = useCallback(
    (canvas: HTMLCanvasElement, mainVid: HTMLVideoElement) => {
      stopDrawLoop();

      const draw = () => {
        if (mainVid.readyState < 2) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const w = canvas.width;
        const h = canvas.height;

        // Main camera frame
        ctx.drawImage(mainVid, 0, 0, w, h);

        // Front-camera PiP in bottom-right corner when dual cam is on
        if (isDualCamRef.current && pipVideoRef.current && pipVideoRef.current.readyState >= 2) {
          const pw = w * 0.28;
          const ph = h * 0.28;
          const px = w - pw - 14;
          const py = h - ph - 14;
          ctx.save();
          ctx.beginPath();
          (ctx as CanvasRenderingContext2D & { roundRect: (...args: unknown[]) => void })
            .roundRect(px, py, pw, ph, 12);
          ctx.clip();
          ctx.drawImage(pipVideoRef.current, px, py, pw, ph);
          ctx.restore();
          ctx.strokeStyle = "rgba(255,255,255,0.55)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          (ctx as CanvasRenderingContext2D & { roundRect: (...args: unknown[]) => void })
            .roundRect(px, py, pw, ph, 12);
          ctx.stroke();
        }

        // Burn watermark at 50% opacity — top left, always present
        drawWatermark(ctx, 12, 12);
      };

      const fps = isTimeLapseRef.current ? 5 : 30;
      drawIntervalRef.current = setInterval(draw, 1000 / fps);
    },
    [stopDrawLoop]
  );

  const startCamera = useCallback(
    async (fm: "environment" | "user" = facingMode, q: VideoQuality = quality) => {
      try {
        stopDrawLoop();
        if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
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
          await videoRef.current.play().catch(() => {});
        }

        // Set up offscreen recording canvas
        const videoTrack = stream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();
        const cw = settings.width || constraints.width;
        const ch = settings.height || constraints.height;

        let canvas = recordingCanvasRef.current;
        if (!canvas) {
          canvas = document.createElement("canvas");
          recordingCanvasRef.current = canvas;
        }
        canvas.width = cw;
        canvas.height = ch;

        // Capture recording stream from canvas (video)
        const canvasStream = canvas.captureStream(); // uncapped = browser handles fps

        // Add audio tracks from the real camera stream
        if (!isTimeLapseRef.current) {
          stream.getAudioTracks().forEach((t) => canvasStream.addTrack(t));
        }

        const mime = detectMimeType();
        setMimeType(mime);

        const recorder = new MediaRecorder(canvasStream, mime ? { mimeType: mime } : {});
        mediaRecorderRef.current = recorder;
        chunksRef.current = [];
        initChunkRef.current = null;

        let isFirstChunk = true;
        recorder.ondataavailable = (e) => {
          if (!e.data || e.data.size === 0) return;
          const now = Date.now();
          if (isFirstChunk) {
            initChunkRef.current = e.data;
            isFirstChunk = false;
          } else {
            chunksRef.current.push({ blob: e.data, time: now });
            const cutoff = now - bufferSeconds * 1000;
            chunksRef.current = chunksRef.current.filter((c) => c.time >= cutoff);
          }
          if (flushCallbackRef.current) {
            const cb = flushCallbackRef.current;
            flushCallbackRef.current = null;
            cb();
          }
        };

        recorder.start(500);
        setIsRecording(true);
        setError(null);

        // Start drawing loop AFTER recorder has started
        if (videoRef.current) {
          startDrawLoop(canvas, videoRef.current);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Camera access denied";
        setError(message);
        setIsRecording(false);
      }
    },
    [facingMode, quality, bufferSeconds, startDrawLoop, stopDrawLoop]
  );

  const stopCamera = useCallback(() => {
    stopDrawLoop();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
  }, [stopDrawLoop]);

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

  const toggleTimeLapse = useCallback(() => {
    const next = !isTimeLapseRef.current;
    isTimeLapseRef.current = next;
    setIsTimeLapse(next);
    // Restart draw loop at new fps
    if (recordingCanvasRef.current && videoRef.current) {
      startDrawLoop(recordingCanvasRef.current, videoRef.current);
    }
  }, [startDrawLoop]);

  const toggleDualCam = useCallback(async () => {
    if (isDualCamRef.current) {
      // Turn off
      isDualCamRef.current = false;
      setIsDualCam(false);
      if (pipStreamRef.current) {
        pipStreamRef.current.getTracks().forEach((t) => t.stop());
        pipStreamRef.current = null;
      }
      if (pipVideoRef.current) {
        pipVideoRef.current.srcObject = null;
      }
    } else {
      // Turn on — try to get the front camera
      try {
        const frontStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        pipStreamRef.current = frontStream;
        if (!pipVideoRef.current) {
          pipVideoRef.current = document.createElement("video");
          pipVideoRef.current.muted = true;
          pipVideoRef.current.playsInline = true;
        }
        pipVideoRef.current.srcObject = frontStream;
        await pipVideoRef.current.play().catch(() => {});
        isDualCamRef.current = true;
        setIsDualCam(true);
      } catch {
        setError("Dual camera not supported on this device");
        setTimeout(() => setError(null), 3000);
      }
    }
  }, []);

  const requestFlushAndGet = useCallback(
    (onFlushed: () => void) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state !== "recording") {
        onFlushed();
        return;
      }
      flushCallbackRef.current = onFlushed;
      recorder.requestData();
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
    return () => {
      stopCamera();
      if (pipStreamRef.current) {
        pipStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isRecording) {
      setElapsedSeconds(0);
      intervalRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
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
    isTimeLapse,
    isDualCam,
    toggleTimeLapse,
    toggleDualCam,
    getChunks,
    getInitChunk,
    getStream,
    requestFlushAndGet,
    startCamera,
    stopCamera,
  };
}
