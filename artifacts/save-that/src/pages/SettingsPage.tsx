import { useState } from "react";
import { useLocation } from "wouter";
import { RotateCcw, Save, Trash2, HardDrive, Download, Cloud, MapPin, Music2, Layout } from "lucide-react";
import { AppIcon } from "@/components/AppIcon";
import { BottomNav } from "@/components/BottomNav";
import { useSwipeNav } from "@/hooks/useSwipeNav";
import { clipStorage } from "@/utils/clipStorage";

function getNum(key: string, def: number) {
  const v = localStorage.getItem(key);
  return v !== null ? Number(v) : def;
}
function getBool(key: string, def: boolean) {
  const v = localStorage.getItem(key);
  return v !== null ? v === "true" : def;
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0"
      style={{ background: value ? "#FFB800" : "rgba(255,255,255,0.15)" }}
    >
      <span
        className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
        style={{ transform: value ? "translateX(24px)" : "translateX(4px)" }}
      />
    </button>
  );
}

function Slider({
  value, min, max, step = 1, onChange,
}: { value: number; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  return (
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1.5 rounded-full cursor-pointer"
      style={{ accentColor: "#FFB800" }}
    />
  );
}

const DEFAULTS = {
  bufferMinutes: 10,
  videoQuality: "720p",
  audioEnabled: true,
  autoSave: false,
  autoDownload: false,
  maxClips: 50,
  notifications: true,
  soundTimerBar: true,
  storageMode: "device",
  showMediaPlayer: true,
  showLocation: false,
  showNowPlaying: false,
  customSaveSeconds: 0,
};

export default function SettingsPage() {
  const [, navigate] = useLocation();

  // Swipe left → Camera
  useSwipeNav({ onSwipeLeft: () => navigate("/") });

  const [bufferMinutes, setBufferMinutes] = useState(() => getNum("bufferMinutes", DEFAULTS.bufferMinutes));
  const [videoQuality, setVideoQuality] = useState(() => localStorage.getItem("videoQuality") || DEFAULTS.videoQuality);
  const [audioEnabled, setAudioEnabled] = useState(() => getBool("audioEnabled", DEFAULTS.audioEnabled));
  const [autoSave, setAutoSave] = useState(() => getBool("autoSave", DEFAULTS.autoSave));
  const [autoDownload, setAutoDownload] = useState(() => getBool("autoDownload", DEFAULTS.autoDownload));
  const [maxClips, setMaxClips] = useState(() => getNum("maxClips", DEFAULTS.maxClips));
  const [notifications, setNotifications] = useState(() => getBool("notifications", DEFAULTS.notifications));
  const [soundTimerBar, setSoundTimerBar] = useState(() => getBool("soundTimerBar", DEFAULTS.soundTimerBar));
  const [storageMode, setStorageMode] = useState(() => localStorage.getItem("storageMode") || DEFAULTS.storageMode);
  const [showMediaPlayer, setShowMediaPlayer] = useState(() => getBool("showMediaPlayer", DEFAULTS.showMediaPlayer));
  const [showLocation, setShowLocation] = useState(() => getBool("showLocation", DEFAULTS.showLocation));
  const [showNowPlaying, setShowNowPlaying] = useState(() => getBool("showNowPlaying", DEFAULTS.showNowPlaying));
  const [customInput, setCustomInput] = useState(() => {
    const v = getNum("customSaveSeconds", 0);
    return v > 0 ? String(v) : "";
  });
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handleSave = () => {
    localStorage.setItem("bufferMinutes", String(bufferMinutes));
    localStorage.setItem("videoQuality", videoQuality);
    localStorage.setItem("audioEnabled", String(audioEnabled));
    localStorage.setItem("autoSave", String(autoSave));
    localStorage.setItem("autoDownload", String(autoDownload));
    localStorage.setItem("maxClips", String(maxClips));
    localStorage.setItem("notifications", String(notifications));
    localStorage.setItem("soundTimerBar", String(soundTimerBar));
    localStorage.setItem("storageMode", storageMode);
    localStorage.setItem("showMediaPlayer", String(showMediaPlayer));
    localStorage.setItem("showLocation", String(showLocation));
    localStorage.setItem("showNowPlaying", String(showNowPlaying));
    const cust = Math.max(0, parseInt(customInput) || 0);
    localStorage.setItem("customSaveSeconds", String(cust));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setBufferMinutes(DEFAULTS.bufferMinutes);
    setVideoQuality(DEFAULTS.videoQuality);
    setAudioEnabled(DEFAULTS.audioEnabled);
    setAutoSave(DEFAULTS.autoSave);
    setAutoDownload(DEFAULTS.autoDownload);
    setMaxClips(DEFAULTS.maxClips);
    setNotifications(DEFAULTS.notifications);
    setSoundTimerBar(DEFAULTS.soundTimerBar);
    setStorageMode(DEFAULTS.storageMode);
    setShowMediaPlayer(DEFAULTS.showMediaPlayer);
    setShowLocation(DEFAULTS.showLocation);
    setShowNowPlaying(DEFAULTS.showNowPlaying);
    setCustomInput("");
  };

  const handleDeleteAll = () => {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    clipStorage.deleteAll();
    setDeleteConfirm(false);
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-5">
      <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#FFB800" }}>{title}</h2>
      <div className="rounded-xl overflow-hidden"
        style={{ background: "rgba(60,9,108,0.4)", border: "1px solid rgba(255,184,0,0.1)" }}>
        {children}
      </div>
    </div>
  );

  const Row = ({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/5 last:border-0 gap-3">
      <div className="min-w-0">
        <p className="text-sm text-white/85">{label}</p>
        {sub && <p className="text-xs text-white/35 mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  );

  const storageModes = [
    { id: "device", label: "Phone / Download", icon: <HardDrive className="w-4 h-4" />, sub: "Auto-downloads to your device on save" },
    { id: "session", label: "In-App Only", icon: <Download className="w-4 h-4" />, sub: "Clips stay in-app until you export manually" },
    { id: "cloud", label: "Cloud (Coming Soon)", icon: <Cloud className="w-4 h-4" />, sub: "Sign in to sync clips to your account" },
  ];

  const customSec = parseInt(customInput) || 0;
  const customLabel = customSec > 0
    ? customSec < 60 ? `${customSec}s`
    : `${Math.floor(customSec / 60)}m${customSec % 60 > 0 ? ` ${customSec % 60}s` : ""}`
    : null;

  return (
    <div className="flex flex-col h-screen overflow-hidden"
      style={{ background: "linear-gradient(to bottom, #240046, #10002B)" }}>

      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-5 pb-3 shrink-0">
        <AppIcon size={22} />
        <h1 className="font-black uppercase tracking-wide text-base"
          style={{ color: "#7B2FBE", fontFamily: "Impact, Arial Black, sans-serif", WebkitTextStroke: "0.5px rgba(255,140,0,0.5)" }}>
          SETTINGS
        </h1>
        <span className="ml-auto text-white/25 text-xs">← Swipe left for camera</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-2">

        <Section title="Storage Location">
          <div className="p-3 flex flex-col gap-2">
            {storageModes.map((mode) => (
              <button key={mode.id}
                onClick={() => {
                  if (mode.id === "cloud") return;
                  setStorageMode(mode.id);
                  setAutoDownload(mode.id === "device");
                }}
                className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left"
                style={{
                  background: storageMode === mode.id ? "rgba(255,184,0,0.15)" : "rgba(255,255,255,0.05)",
                  border: storageMode === mode.id ? "1px solid rgba(255,184,0,0.4)" : "1px solid transparent",
                  opacity: mode.id === "cloud" ? 0.45 : 1,
                  cursor: mode.id === "cloud" ? "not-allowed" : "pointer",
                }}>
                <span style={{ color: storageMode === mode.id ? "#FFB800" : "rgba(255,255,255,0.5)" }}>
                  {mode.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: storageMode === mode.id ? "#FFB800" : "white" }}>
                    {mode.label}
                  </p>
                  <p className="text-xs text-white/40">{mode.sub}</p>
                </div>
                {storageMode === mode.id && (
                  <span className="ml-auto text-xs font-bold" style={{ color: "#FFB800" }}>✓</span>
                )}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Recording">
          <Row label={`Buffer Duration: ${bufferMinutes} min`} sub="How far back you can save">
            <div className="w-28 shrink-0"><Slider value={bufferMinutes} min={1} max={60} onChange={setBufferMinutes} /></div>
          </Row>
          <Row label="Video Quality">
            <div className="flex gap-1 shrink-0">
              {["480p", "720p", "1080p"].map((q) => (
                <button key={q} onClick={() => setVideoQuality(q)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                  style={{ background: videoQuality === q ? "#FFB800" : "rgba(255,255,255,0.1)", color: videoQuality === q ? "#1a0030" : "white" }}>
                  {q}
                </button>
              ))}
            </div>
          </Row>
          <Row label="Record Audio"><Toggle value={audioEnabled} onChange={setAudioEnabled} /></Row>
          <Row label="Auto Save" sub="Automatically save at buffer interval"><Toggle value={autoSave} onChange={setAutoSave} /></Row>
        </Section>

        <Section title="Custom Save Button">
          <div className="px-4 py-4 flex flex-col gap-3">
            <p className="text-xs text-white/45">
              Sets the orange +Custom button on the camera. Enter seconds (e.g. 45 = 45s, 90 = 1m 30s).
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number" min={1} max={3600} placeholder="e.g. 45"
                value={customInput} onChange={(e) => setCustomInput(e.target.value)}
                className="flex-1 rounded-xl px-3 py-2.5 text-sm font-bold text-white outline-none"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,140,0,0.3)" }}
              />
              {customLabel && (
                <div className="px-3 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: "#FF8C00", color: "white" }}>
                  + {customLabel}
                </div>
              )}
            </div>
          </div>
        </Section>

        <Section title="Camera Overlays">
          <Row label="Location Display" sub="Shows GPS coordinates on the video">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" style={{ color: showLocation ? "#FFB800" : "rgba(255,255,255,0.3)" }} />
              <Toggle value={showLocation} onChange={setShowLocation} />
            </div>
          </Row>
          <Row label="Media Player Button" sub="Mini player controls while recording">
            <div className="flex items-center gap-2">
              <Music2 className="w-4 h-4" style={{ color: showMediaPlayer ? "#FFB800" : "rgba(255,255,255,0.3)" }} />
              <Toggle value={showMediaPlayer} onChange={setShowMediaPlayer} />
            </div>
          </Row>
          <Row label="Now Playing Bar" sub="Shows current song at bottom of video">
            <div className="flex items-center gap-2">
              <Layout className="w-4 h-4" style={{ color: showNowPlaying ? "#FFB800" : "rgba(255,255,255,0.3)" }} />
              <Toggle value={showNowPlaying} onChange={setShowNowPlaying} />
            </div>
          </Row>
          <Row label="Sound Timer Bar" sub="Audio frequency visualizer">
            <Toggle value={soundTimerBar} onChange={setSoundTimerBar} />
          </Row>
          <Row label="Notifications"><Toggle value={notifications} onChange={setNotifications} /></Row>
        </Section>

        <Section title="Clip Management">
          <Row label={`Max In-App Clips: ${maxClips}`}>
            <div className="w-28 shrink-0"><Slider value={maxClips} min={10} max={100} step={10} onChange={setMaxClips} /></div>
          </Row>
          <div className="px-4 py-3">
            <button onClick={handleDeleteAll}
              className="w-full py-2.5 rounded-xl text-sm font-bold transition-colors"
              style={{ background: deleteConfirm ? "#CC0000" : "rgba(255,30,0,0.15)", color: deleteConfirm ? "white" : "#FF6060" }}>
              <span className="flex items-center justify-center gap-2">
                <Trash2 className="w-4 h-4" />
                {deleteConfirm ? "Tap again to confirm" : "Delete All In-App Clips"}
              </span>
            </button>
          </div>
        </Section>

        <div className="flex gap-3 mb-4">
          <button onClick={handleSave}
            className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
            style={{ background: saved ? "#22c55e" : "#FFB800", color: saved ? "white" : "#1a0030" }}>
            <Save className="w-4 h-4" />
            {saved ? "Saved!" : "Save Settings"}
          </button>
          <button onClick={handleReset}
            className="px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2"
            style={{ background: "rgba(255,255,255,0.1)", color: "white" }}>
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>

        <p className="text-center text-white/20 text-xs mb-2">
          Save That — Beta · Watermark is burned into recorded video
        </p>
      </div>

      {/* SHARED BOTTOM NAV */}
      <BottomNav current="settings" />
    </div>
  );
}
