import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Settings, Images, Music, SwitchCamera, ChevronDown } from "lucide-react";
import { AppIcon, Watermark } from "@/components/AppIcon";
import { AudioVisualization } from "@/components/AudioVisualization";
import { TimeSegmentButtons } from "@/components/TimeSegmentButtons";
import { useCamera, VideoQuality, CropMode } from "@/hooks/useCamera";
import { useAudioAnalysis } from "@/hooks/useAudioAnalysis";
import { useSaveClips } from "@/hooks/useSaveClips";

const QUALITY_OPTIONS: VideoQuality[] = ["420p", "720p", "1080p", "4K"];
const CROP_OPTIONS: { label: string; value: CropMode }[] = [
  { label: "Full Screen", value: "full" },
  { label: "Landscape", value: "landscape" },
  { label: "Portrait", value: "portrait" },
  { label: "16:9", value: "16:9" },
  { label: "4:3", value: "4:3" },
  { label: "1:1", value: "1:1" },
];

const CROP_STYLES: Record<CropMode, React.CSSProperties> = {
  full: {},
  landscape: { aspectRatio: "16/9" },
  portrait: { aspectRatio: "9/16" },
  "16:9": { aspectRatio: "16/9" },
  "4:3": { aspectRatio: "4/3" },
  "1:1": { aspectRatio: "1/1" },
};

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export default function CameraPage() {
  const [, navigate] = useLocation();
  const bufferMinutes = parseInt(localStorage.getItem("bufferMinutes") || "10");
  const autoDownload = localStorage.getItem("autoDownload") === "true";

  const {
    videoRef,
    isRecording,
    quality,
    setQuality,
    cropMode,
    setCropMode,
    switchCamera,
    elapsedSeconds,
    mimeType,
    error,
    getChunks,
    getInitChunk,
    getStream,
  } = useCamera(bufferMinutes * 60);

  const [soundBarEnabled, setSoundBarEnabled] = useState(
    () => localStorage.getItem("soundTimerBar") !== "false"
  );
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showCropMenu, setShowCropMenu] = useState(false);
  const [saveFlash, setSaveFlash] = useState<string | null>(null);

  const stream = getStream();
  const { audioData } = useAudioAnalysis(stream, soundBarEnabled && isRecording);
  const { saveLastSeconds } = useSaveClips(getChunks, getInitChunk, mimeType);

  const qualityRef = useRef<HTMLDivElement>(null);
  const cropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (qualityRef.current && !qualityRef.current.contains(e.target as Node))
        setShowQualityMenu(false);
      if (cropRef.current && !cropRef.current.contains(e.target as Node))
        setShowCropMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSave = (seconds: number) => {
    const clip = saveLastSeconds(seconds);
    if (clip) {
      const label = seconds < 60 ? `${seconds}s` : `${seconds / 60}m`;
      setSaveFlash(`✓ Saved last ${label}`);
      setTimeout(() => setSaveFlash(null), 2500);

      // Auto-download to device if enabled
      if (autoDownload) {
        const a = document.createElement("a");
        a.href = clip.url;
        a.download = `save-that-${clip.timestamp.getTime()}.webm`;
        a.click();
      }
    } else {
      setSaveFlash("Recording still starting…");
      setTimeout(() => setSaveFlash(null), 2000);
    }
  };

  const toggleSoundBar = () => {
    const next = !soundBarEnabled;
    setSoundBarEnabled(next);
    localStorage.setItem("soundTimerBar", String(next));
  };

  const cropLabel = CROP_OPTIONS.find((o) => o.value === cropMode)?.label ?? "Full Screen";

  return (
    <div className="flex flex-col h-screen bg-black select-none overflow-hidden">
      {/* VIDEO AREA */}
      <div className="relative flex-1 bg-black overflow-hidden">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3 p-6">
            <div className="text-5xl">📷</div>
            <p className="text-center text-white/80 text-sm max-w-xs">
              Camera access required. Please allow camera permissions and reload.
            </p>
            <p className="text-xs text-red-400">{error}</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
            style={CROP_STYLES[cropMode]}
          />
        )}

        {/* TOP LEFT: Logo + Timer */}
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 rounded-xl px-3 py-2 backdrop-blur-sm">
          <AppIcon size={22} />
          <span
            className="font-black uppercase tracking-wide text-sm"
            style={{
              color: "#FFB800",
              WebkitTextStroke: "1px #3C096C",
              fontFamily: "Impact, Arial Black, sans-serif",
            }}
          >
            SAVE THAT
          </span>
          <div className="flex items-center gap-1.5 ml-1">
            <span className="rec-dot w-2 h-2 rounded-full bg-red-500 inline-block" />
            <span className="text-white/80 text-xs font-mono">{formatTime(elapsedSeconds)}</span>
          </div>
        </div>

        {/* TOP RIGHT: Quality + Crop */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
          <div ref={qualityRef} className="relative">
            <button
              onClick={() => { setShowQualityMenu((v) => !v); setShowCropMenu(false); }}
              className="flex items-center gap-1 bg-black/50 text-white text-xs rounded-lg px-3 py-2 backdrop-blur-sm"
            >
              {quality} <ChevronDown className="w-3 h-3" />
            </button>
            {showQualityMenu && (
              <div className="absolute right-0 top-9 z-50 rounded-xl overflow-hidden shadow-xl"
                style={{ background: "#2D0060" }}>
                {QUALITY_OPTIONS.map((q) => (
                  <button key={q} onClick={() => { setQuality(q); setShowQualityMenu(false); }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors"
                    style={{ color: q === quality ? "#FFB800" : "white" }}>
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div ref={cropRef} className="relative">
            <button
              onClick={() => { setShowCropMenu((v) => !v); setShowQualityMenu(false); }}
              className="flex items-center gap-1 bg-black/50 text-white text-xs rounded-lg px-3 py-2 backdrop-blur-sm"
            >
              {cropLabel} <ChevronDown className="w-3 h-3" />
            </button>
            {showCropMenu && (
              <div className="absolute right-0 top-9 z-50 rounded-xl overflow-hidden shadow-xl"
                style={{ background: "#2D0060" }}>
                {CROP_OPTIONS.map((o) => (
                  <button key={o.value} onClick={() => { setCropMode(o.value); setShowCropMenu(false); }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors"
                    style={{ color: o.value === cropMode ? "#FFB800" : "white" }}>
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM LEFT on video: Sound bar toggle */}
        <button onClick={toggleSoundBar}
          className="absolute bottom-4 left-4 p-2.5 rounded-full bg-black/50 backdrop-blur-sm"
          style={{ color: soundBarEnabled ? "#FFB800" : "rgba(255,255,255,0.5)" }}>
          <Music className="w-5 h-5" />
        </button>

        {/* BOTTOM RIGHT on video: Switch camera */}
        <button onClick={switchCamera}
          className="absolute bottom-4 right-4 p-2.5 rounded-full bg-black/50 backdrop-blur-sm text-white">
          <SwitchCamera className="w-5 h-5" />
        </button>

        {/* WATERMARK - bottom center of video like TikTok/Instagram */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <Watermark />
        </div>

        {/* SAVE FLASH */}
        {saveFlash && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/85 text-white text-sm font-bold rounded-xl px-6 py-3 backdrop-blur-sm z-50 pointer-events-none">
            {saveFlash}
          </div>
        )}
      </div>

      {/* PURPLE CONTROL BAR */}
      <div
        className="flex flex-col gap-3 px-4 pt-3 pb-5 shrink-0"
        style={{ background: "linear-gradient(to bottom, #3C096C, #240046)" }}
      >
        {soundBarEnabled && <AudioVisualization audioData={audioData} />}
        <TimeSegmentButtons onSave={handleSave} />

        <div className="flex justify-between items-center mt-1">
          <button onClick={() => navigate("/settings")} className="p-2.5 rounded-full bg-black/50">
            <Settings className="w-5 h-5" style={{ color: "#FFB800" }} />
          </button>
          <button onClick={() => navigate("/clips")} className="p-2.5 rounded-full bg-black/50">
            <Images className="w-5 h-5" style={{ color: "#FFB800" }} />
          </button>
        </div>
      </div>
    </div>
  );
}
