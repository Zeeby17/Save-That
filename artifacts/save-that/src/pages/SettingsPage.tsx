import { useState } from "react";
import { useLocation } from "wouter";
import { Camera, RotateCcw, Save, Trash2, HardDrive, Download, Cloud } from "lucide-react";
import { AppIcon } from "@/components/AppIcon";
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
    <input
      type="range" min={min} max={max} step={step} value={value}
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
  storageMode: "device", // "device" | "cloud" | "session"
};

export default function SettingsPage() {
  const [, navigate] = useLocation();
  const [bufferMinutes, setBufferMinutes] = useState(() => getNum("bufferMinutes", DEFAULTS.bufferMinutes));
  const [videoQuality, setVideoQuality] = useState(() => localStorage.getItem("videoQuality") || DEFAULTS.videoQuality);
  const [audioEnabled, setAudioEnabled] = useState(() => getBool("audioEnabled", DEFAULTS.audioEnabled));
  const [autoSave, setAutoSave] = useState(() => getBool("autoSave", DEFAULTS.autoSave));
  const [autoDownload, setAutoDownload] = useState(() => getBool("autoDownload", DEFAULTS.autoDownload));
  const [maxClips, setMaxClips] = useState(() => getNum("maxClips", DEFAULTS.maxClips));
  const [notifications, setNotifications] = useState(() => getBool("notifications", DEFAULTS.notifications));
  const [soundTimerBar, setSoundTimerBar] = useState(() => getBool("soundTimerBar", DEFAULTS.soundTimerBar));
  const [storageMode, setStorageMode] = useState(() => localStorage.getItem("storageMode") || DEFAULTS.storageMode);
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
  };

  const handleDeleteAll = () => {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    clipStorage.deleteAll();
    setDeleteConfirm(false);
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-5">
      <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#FFB800" }}>{title}</h2>
      <div className="rounded-xl overflow-hidden" style={{ background: "rgba(60,9,108,0.4)", border: "1px solid rgba(255,184,0,0.1)" }}>
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
    { id: "device", label: "Phone / Download", icon: <HardDrive className="w-4 h-4" />, sub: "Auto-downloads .webm to your device on save" },
    { id: "session", label: "In-App Only", icon: <Download className="w-4 h-4" />, sub: "Clips stay in-app until you export manually" },
    { id: "cloud", label: "Cloud (Coming Soon)", icon: <Cloud className="w-4 h-4" />, sub: "Sign in to sync clips to your account" },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "linear-gradient(to bottom, #240046, #10002B)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <AppIcon size={22} />
          <h1 className="font-black uppercase tracking-wide text-base"
            style={{ color: "#FFB800", fontFamily: "Impact, Arial Black, sans-serif", WebkitTextStroke: "1px #3C096C" }}>
            SETTINGS
          </h1>
        </div>
        <button onClick={() => navigate("/")} className="p-2 rounded-full bg-white/10">
          <Camera className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">

        {/* STORAGE LOCATION */}
        <Section title="Storage Location">
          <div className="p-3 flex flex-col gap-2">
            {storageModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => {
                  if (mode.id === "cloud") return; // coming soon
                  setStorageMode(mode.id);
                  if (mode.id === "device") setAutoDownload(true);
                  else setAutoDownload(false);
                }}
                className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left"
                style={{
                  background: storageMode === mode.id ? "rgba(255,184,0,0.15)" : "rgba(255,255,255,0.05)",
                  border: storageMode === mode.id ? "1px solid rgba(255,184,0,0.4)" : "1px solid transparent",
                  opacity: mode.id === "cloud" ? 0.45 : 1,
                  cursor: mode.id === "cloud" ? "not-allowed" : "pointer",
                }}
              >
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

        {/* RECORDING */}
        <Section title="Recording">
          <Row label={`Buffer Duration: ${bufferMinutes} min`} sub="How far back you can save">
            <div className="w-28 shrink-0">
              <Slider value={bufferMinutes} min={1} max={60} onChange={setBufferMinutes} />
            </div>
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

        {/* STORAGE MANAGEMENT */}
        <Section title="Clip Management">
          <Row label={`Max In-App Clips: ${maxClips}`}>
            <div className="w-28 shrink-0">
              <Slider value={maxClips} min={10} max={100} step={10} onChange={setMaxClips} />
            </div>
          </Row>
          <div className="px-4 py-3">
            <button
              onClick={handleDeleteAll}
              className="w-full py-2.5 rounded-xl text-sm font-bold transition-colors"
              style={{
                background: deleteConfirm ? "#CC0000" : "rgba(255,30,0,0.15)",
                color: deleteConfirm ? "white" : "#FF6060",
              }}
            >
              <span className="flex items-center justify-center gap-2">
                <Trash2 className="w-4 h-4" />
                {deleteConfirm ? "Tap again to confirm" : "Delete All In-App Clips"}
              </span>
            </button>
          </div>
        </Section>

        {/* PREFERENCES */}
        <Section title="App Preferences">
          <Row label="Sound Timer Bar" sub="Audio frequency visualizer"><Toggle value={soundTimerBar} onChange={setSoundTimerBar} /></Row>
          <Row label="Notifications"><Toggle value={notifications} onChange={setNotifications} /></Row>
        </Section>

        {/* ACTION BUTTONS */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
            style={{ background: saved ? "#22c55e" : "#FFB800", color: saved ? "white" : "#1a0030" }}
          >
            <Save className="w-4 h-4" />
            {saved ? "Saved!" : "Save Settings"}
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2"
            style={{ background: "rgba(255,255,255,0.1)", color: "white" }}
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>

        {/* Beta note */}
        <p className="text-center text-white/25 text-xs mt-6">
          Save That — Beta · Clips are in-app only this session unless saved to device
        </p>
      </div>
    </div>
  );
}
