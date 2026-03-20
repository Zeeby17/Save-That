import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Download, Scissors, Loader } from "lucide-react";

interface TrimEditorProps {
  url: string;
  mimeType: string;
  filename: string;
  onClose: () => void;
}

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(1);
  return `${m}:${sec.padStart(4, "0")}`;
}

// Re-encode a trimmed section of a video using canvas + MediaRecorder.
// Captures both video (canvas frames) and audio (AudioContext routing).
async function exportTrimmed(
  sourceUrl: string,
  startSec: number,
  endSec: number,
  mimeType: string,
  onProgress: (p: number) => void
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = sourceUrl;
    video.crossOrigin = "anonymous";
    video.preload = "auto";
    video.muted = true; // muted for canvas capture; audio handled separately

    video.onloadedmetadata = () => {
      const w = video.videoWidth || 1280;
      const h = video.videoHeight || 720;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;

      // Set up audio routing
      const audioCtx = new AudioContext();
      const audioSrc = audioCtx.createMediaElementSource(video);
      const audioDest = audioCtx.createMediaStreamDestination();
      audioSrc.connect(audioDest);
      // Don't connect to destination — we don't want speaker output

      // Combine canvas video stream + audio stream
      const videoStream = canvas.captureStream(30);
      const combined = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioDest.stream.getAudioTracks(),
      ]);

      // Pick best supported MIME for re-encoding
      const outMime = MediaRecorder.isTypeSupported(mimeType)
        ? mimeType
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus"
        : "video/webm";

      const recorder = new MediaRecorder(combined, { mimeType: outMime });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        audioCtx.close();
        resolve(new Blob(chunks, { type: outMime }));
      };

      video.currentTime = startSec;
      video.muted = false; // unmute once AudioContext source is set up

      video.onseeked = () => {
        recorder.start(200);
        video.play().catch(reject);

        let rafId: number;
        const duration = endSec - startSec;

        const drawLoop = () => {
          if (video.currentTime >= endSec) {
            recorder.stop();
            video.pause();
            cancelAnimationFrame(rafId);
            return;
          }
          ctx.drawImage(video, 0, 0, w, h);
          onProgress((video.currentTime - startSec) / duration);
          rafId = requestAnimationFrame(drawLoop);
        };

        rafId = requestAnimationFrame(drawLoop);
      };
    };

    video.onerror = () => reject(new Error("Failed to load video for trimming"));
  });
}

export function TrimEditor({ url, mimeType, filename, onClose }: TrimEditorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportDone, setExportDone] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onMeta = () => {
      setDuration(video.duration);
      setEndTime(video.duration);
    };
    const onTime = () => setCurrentTime(video.currentTime);
    const onEnded = () => setIsPlaying(false);
    video.addEventListener("loadedmetadata", onMeta);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("ended", onEnded);
    return () => {
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("ended", onEnded);
    };
  }, []);

  // Stop playback when it reaches end time
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isPlaying) return;
    if (currentTime >= endTime) {
      video.pause();
      setIsPlaying(false);
    }
  }, [currentTime, endTime, isPlaying]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.currentTime = startTime;
      video.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [isPlaying, startTime]);

  const seekTo = useCallback((t: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = t;
    setCurrentTime(t);
  }, []);

  const handleExport = async () => {
    setExporting(true);
    setExportProgress(0);
    setExportDone(false);
    try {
      const trimmed = await exportTrimmed(url, startTime, endTime, mimeType, setExportProgress);
      const ext = trimmed.type.includes("mp4") ? "mp4" : "webm";
      const a = document.createElement("a");
      a.href = URL.createObjectURL(trimmed);
      a.download = `${filename}-trim-${Math.round(startTime)}s-${Math.round(endTime)}s.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setExportDone(true);
      setTimeout(() => setExportDone(false), 3000);
    } catch (err) {
      console.error("Trim export failed", err);
    } finally {
      setExporting(false);
      setExportProgress(0);
    }
  };

  const trimDuration = endTime - startTime;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "rgba(20,0,50,0.95)", border: "1px solid rgba(255,140,0,0.3)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Scissors className="w-4 h-4" style={{ color: "#FFB800" }} />
          <span className="text-sm font-bold text-white">Trim Clip</span>
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-white/10">
          Cancel
        </button>
      </div>

      {/* Video preview */}
      <div className="relative bg-black">
        <video
          ref={videoRef}
          src={url}
          className="w-full aspect-video"
          playsInline
          preload="metadata"
        />
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20"
        >
          <div className="w-14 h-14 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm">
            {isPlaying
              ? <Pause className="w-6 h-6 text-white fill-white" />
              : <Play className="w-6 h-6 text-white fill-white ml-1" />
            }
          </div>
        </button>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Timeline scrubber */}
        {duration > 0 && (
          <div className="flex flex-col gap-2">
            {/* Current position */}
            <div className="flex justify-between text-xs text-white/40">
              <span>Current: {fmt(currentTime)}</span>
              <span>Total: {fmt(duration)}</span>
            </div>

            {/* Playhead */}
            <input
              type="range"
              min={0}
              max={duration}
              step={0.1}
              value={currentTime}
              onChange={(e) => seekTo(Number(e.target.value))}
              className="w-full h-1 rounded-full cursor-pointer"
              style={{ accentColor: "#FFB800" }}
            />

            {/* Trim range */}
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-white/60">Start: <span style={{ color: "#FFB800" }}>{fmt(startTime)}</span></span>
                <span className="text-white/60">
                  Duration: <span className="text-white font-bold">{fmt(trimDuration)}</span>
                </span>
                <span className="text-white/60">End: <span style={{ color: "#FFB800" }}>{fmt(endTime)}</span></span>
              </div>

              {/* Visual trim bar */}
              <div className="relative h-8 rounded-lg overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                {/* Selected region highlight */}
                <div
                  className="absolute top-0 bottom-0 rounded"
                  style={{
                    left: `${(startTime / duration) * 100}%`,
                    width: `${((endTime - startTime) / duration) * 100}%`,
                    background: "rgba(255,184,0,0.25)",
                    border: "2px solid rgba(255,184,0,0.6)",
                  }}
                />
                {/* Playhead marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white z-10"
                  style={{ left: `${(currentTime / duration) * 100}%` }}
                />
              </div>

              {/* Start handle */}
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/50 w-10 text-right shrink-0">Start</span>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, endTime - 0.5)}
                    step={0.1}
                    value={startTime}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setStartTime(v);
                      seekTo(v);
                    }}
                    className="flex-1 h-1 rounded-full cursor-pointer"
                    style={{ accentColor: "#FF8C00" }}
                  />
                </div>
                {/* End handle */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/50 w-10 text-right shrink-0">End</span>
                  <input
                    type="range"
                    min={Math.min(duration, startTime + 0.5)}
                    max={duration}
                    step={0.1}
                    value={endTime}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setEndTime(v);
                      seekTo(v);
                    }}
                    className="flex-1 h-1 rounded-full cursor-pointer"
                    style={{ accentColor: "#FF8C00" }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Export button */}
        <div className="flex gap-2">
          <button
            onClick={togglePlay}
            className="px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2"
            style={{ background: "rgba(255,255,255,0.1)", color: "white" }}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            Preview
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || trimDuration < 0.5}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{ background: exportDone ? "#22c55e" : "#FFB800", color: "#1a0030" }}
          >
            {exporting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                {Math.round(exportProgress * 100)}% encoding…
              </>
            ) : exportDone ? (
              "✓ Downloaded!"
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export {fmt(trimDuration)} clip
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-white/30 text-center">
          Export re-encodes the selected portion in real time · takes the same duration as the clip
        </p>
      </div>
    </div>
  );
}
