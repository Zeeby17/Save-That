import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Music, SwitchCamera, ChevronDown, Layers, Music2 } from "lucide-react";
import { AppIcon } from "@/components/AppIcon";
import { AudioVisualization } from "@/components/AudioVisualization";
import { TimeSegmentButtons } from "@/components/TimeSegmentButtons";
import { BottomNav } from "@/components/BottomNav";
import { MediaPlayerOverlay, NowPlayingBar } from "@/components/MediaPlayerOverlay";
import { useCamera, VideoQuality, CropMode } from "@/hooks/useCamera";
import { useAudioAnalysis } from "@/hooks/useAudioAnalysis";
import { useSaveClips } from "@/hooks/useSaveClips";
import { useSwipeNav } from "@/hooks/useSwipeNav";
import { clipStorage } from "@/utils/clipStorage";

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

function getBool(key: string, def: boolean) {
  const v = localStorage.getItem(key);
  return v !== null ? v === "true" : def;
}

export default function CameraPage() {
  const [, navigate] = useLocation();
  const bufferMinutes = parseInt(localStorage.getItem("bufferMinutes") || "10");
  const autoDownload = localStorage.getItem("autoDownload") === "true";
  const customSeconds = parseInt(localStorage.getItem("customSaveSeconds") || "0");

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
    isTimeLapse,
    isDualCam,
    toggleTimeLapse,
    toggleDualCam,
    getChunks,
    getInitChunk,
    getStream,
    getRecordingStart,
    requestFlushAndGet,
  } = useCamera(bufferMinutes * 60);

  const [soundBarEnabled, setSoundBarEnabled] = useState(() => getBool("soundTimerBar", true));
  const [showMediaPlayer, setShowMediaPlayer] = useState(() => getBool("showMediaPlayer", true));
  const [showLocation] = useState(() => getBool("showLocation", false));
  const [showNowPlaying] = useState(() => getBool("showNowPlaying", false));

  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showCropMenu, setShowCropMenu] = useState(false);
  const [saveFlash, setSaveFlash] = useState<string | null>(null);
  const [mediaPlayerOpen, setMediaPlayerOpen] = useState(false);
  const [locationText, setLocationText] = useState<string | null>(null);

  const qualityRef = useRef<HTMLDivElement>(null);
  const cropRef = useRef<HTMLDivElement>(null);

  const stream = getStream();
  const { audioData } = useAudioAnalysis(stream, soundBarEnabled && isRecording);
  const { saveLastSeconds } = useSaveClips(
    getChunks, getInitChunk, mimeType, requestFlushAndGet, getRecordingStart
  );

  // Swipe left → Saved Clips, swipe right → Settings
  useSwipeNav({
    onSwipeLeft: () => navigate("/clips"),
    onSwipeRight: () => navigate("/settings"),
  });

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

  useEffect(() => {
    if (!showLocation) { setLocationText(null); return; }
    const geo = navigator.geolocation;
    if (!geo) { setLocationText("Location unavailable"); return; }
    geo.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(4);
        const lng = pos.coords.longitude.toFixed(4);
        setLocationText(`${lat}° N  ${lng}° W`);
      },
      () => setLocationText("Location denied")
    );
  }, [showLocation]);

  // Reload preferences whenever page becomes visible (user may have changed settings)
  useEffect(() => {
    const refresh = () => {
      setSoundBarEnabled(getBool("soundTimerBar", true));
      setShowMediaPlayer(getBool("showMediaPlayer", true));
    };
    document.addEventListener("visibilitychange", refresh);
    return () => document.removeEventListener("visibilitychange", refresh);
  }, []);

  const handleSave = (seconds: number) => {
    const label = seconds < 60 ? `${seconds}s` : `${seconds / 60}m`;
    setSaveFlash(`⏳ Saving last ${label}…`);
    saveLastSeconds(seconds, (success) => {
      if (success) {
        setSaveFlash(`✓ Saved last ${label}`);
        setTimeout(() => setSaveFlash(null), 2500);
        if (autoDownload) {
          const clips = clipStorage.getAll();
          if (clips.length > 0) {
            const latest = clips[0];
            const ext = latest.mimeType.includes("mp4") ? "mp4" : "webm";
            const a = document.createElement("a");
            a.href = latest.url;
            a.download = `save-that-${latest.timestamp.getTime()}.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
        }
      } else {
        setSaveFlash("Recording still starting…");
        setTimeout(() => setSaveFlash(null), 2000);
      }
    });
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
              Camera access required. Allow camera permissions and reload.
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

        {/* TOP LEFT: Watermark badge + rec timer */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5 items-start">
          <div
            className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 pointer-events-none"
            style={{ background: "rgba(15,0,40,0.65)", border: "1px solid rgba(255,140,0,0.4)" }}
          >
            <AppIcon size={20} />
            <span
              style={{
                fontFamily: "Impact, Arial Black, sans-serif",
                fontSize: "14px",
                color: "#6A0DAD",
                WebkitTextStroke: "0.8px rgba(255,140,0,0.7)",
                letterSpacing: "0.08em",
                fontWeight: 900,
              }}
            >
              SAVE THAT
            </span>
          </div>
          <div className="flex items-center gap-1.5 pl-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
            <span className="text-white/70 text-xs font-mono drop-shadow">
              {formatTime(elapsedSeconds)}
            </span>
            {isTimeLapse && (
              <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                style={{ background: "#FFD700", color: "#1a0030" }}>TL 5fps</span>
            )}
            {isDualCam && (
              <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>DUAL</span>
            )}
          </div>
        </div>

        {/* LOCATION OVERLAY — top center */}
        {showLocation && locationText && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none">
            <div className="px-3 py-1.5 rounded-xl text-xs text-white font-mono"
              style={{ background: "rgba(15,0,40,0.65)", backdropFilter: "blur(8px)" }}>
              📍 {locationText}
            </div>
          </div>
        )}

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
                    style={{ color: q === quality ? "#FFB800" : "white" }}>{q}</button>
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
                    style={{ color: o.value === cropMode ? "#FFB800" : "white" }}>{o.label}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM LEFT: Sound + Media Player */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2">
          <button onClick={toggleSoundBar}
            className="p-2.5 rounded-full bg-black/50 backdrop-blur-sm"
            style={{ color: soundBarEnabled ? "#FFB800" : "rgba(255,255,255,0.5)" }}>
            <Music className="w-5 h-5" />
          </button>
          {showMediaPlayer && (
            <button
              onClick={() => setMediaPlayerOpen((v) => !v)}
              className="p-2.5 rounded-full bg-black/50 backdrop-blur-sm"
              style={{ color: mediaPlayerOpen ? "#FFB800" : "rgba(255,255,255,0.5)" }}>
              <Music2 className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* BOTTOM RIGHT: Dual cam + Switch camera */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          <button onClick={toggleDualCam}
            className="p-2.5 rounded-full bg-black/50 backdrop-blur-sm"
            style={{ color: isDualCam ? "#FFB800" : "rgba(255,255,255,0.5)" }}>
            <Layers className="w-5 h-5" />
          </button>
          <button onClick={switchCamera}
            className="p-2.5 rounded-full bg-black/50 backdrop-blur-sm text-white">
            <SwitchCamera className="w-5 h-5" />
          </button>
        </div>

        {/* NOW PLAYING BAR */}
        {showNowPlaying && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-max max-w-[80%] pointer-events-none">
            <NowPlayingBar />
          </div>
        )}

        {/* MEDIA PLAYER OVERLAY */}
        <MediaPlayerOverlay visible={mediaPlayerOpen} onClose={() => setMediaPlayerOpen(false)} />

        {/* SAVE FLASH */}
        {saveFlash && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/85 text-white text-sm font-bold rounded-xl px-6 py-3 backdrop-blur-sm z-50 pointer-events-none">
            {saveFlash}
          </div>
        )}
      </div>

      {/* PURPLE CONTROL BAR */}
      <div
        className="flex flex-col gap-3 px-4 pt-3 pb-2 shrink-0"
        style={{ background: "linear-gradient(to bottom, #3C096C, #240046)" }}
      >
        {soundBarEnabled && <AudioVisualization audioData={audioData} />}
        <TimeSegmentButtons
          onSave={handleSave}
          isTimeLapse={isTimeLapse}
          onToggleTimeLapse={toggleTimeLapse}
          customSeconds={customSeconds}
        />
      </div>

      {/* SHARED BOTTOM NAV */}
      <BottomNav current="camera" />
    </div>
  );
}
