import { useState } from "react";
import { useLocation } from "wouter";
import { Camera, RotateCcw, Save, Trash2 } from "lucide-react";
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

interface ToggleProps { value: boolean; onChange: (v: boolean) => void; }
function Toggle({ value, onChange }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0"
      style={{ background: value ? "#FF8C00" : "rgba(255,255,255,0.15)" }}
    >
      <span
        className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
        style={{ transform: value ? "translateX(24px)" : "translateX(4px)" }}
      />
    </button>
  );
}

interface SliderProps { value: number; min: number; max: number; step?: number; onChange: (v: number) => void; }
function Slider({ value, min, max, step = 1, onChange }: SliderProps) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-orange-500 h-1.5 rounded-full cursor-pointer"
      style={{ accentColor: "#FF8C00" }}
    />
  );
}

const DEFAULTS = {
  bufferMinutes: 10,
  videoQuality: "720p",
  audioEnabled: true,
  autoSave: false,
  maxClips: 50,
  notifications: true,
  soundTimerBar: true,
};

export default function SettingsPage() {
  const [, navigate] = useLocation();
  const [bufferMinutes, setBufferMinutes] = useState(() => getNum("bufferMinutes", DEFAULTS.bufferMinutes));
  const [videoQuality, setVideoQuality] = useState(() => localStorage.getItem("videoQuality") || DEFAULTS.videoQuality);
  const [audioEnabled, setAudioEnabled] = useState(() => getBool("audioEnabled", DEFAULTS.audioEnabled));
  const [autoSave, setAutoSave] = useState(() => getBool("autoSave", DEFAULTS.autoSave));
  const [maxClips, setMaxClips] = useState(() => getNum("maxClips", DEFAULTS.maxClips));
  const [notifications, setNotifications] = useState(() => getBool("notifications", DEFAULTS.notifications));
  const [soundTimerBar, setSoundTimerBar] = useState(() => getBool("soundTimerBar", DEFAULTS.soundTimerBar));
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handleSave = () => {
    localStorage.setItem("bufferMinutes", String(bufferMinutes));
    localStorage.setItem("videoQuality", videoQuality);
    localStorage.setItem("audioEnabled", String(audioEnabled));
    localStorage.setItem("autoSave", String(autoSave));
    localStorage.setItem("maxClips", String(maxClips));
    localStorage.setItem("notifications", String(notifications));
    localStorage.setItem("soundTimerBar", String(soundTimerBar));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setBufferMinutes(DEFAULTS.bufferMinutes);
    setVideoQuality(DEFAULTS.videoQuality);
    setAudioEnabled(DEFAULTS.audioEnabled);
    setAutoSave(DEFAULTS.autoSave);
    setMaxClips(DEFAULTS.maxClips);
    setNotifications(DEFAULTS.notifications);
    setSoundTimerBar(DEFAULTS.soundTimerBar);
  };

  const handleDeleteAll = () => {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    clipStorage.deleteAll();
    setDeleteConfirm(false);
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-5">
      <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#FF8C00" }}>{title}</h2>
      <div className="rounded-xl overflow-hidden" style={{ background: "rgba(60,9,108,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>
        {children}
      </div>
    </div>
  );

  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/5 last:border-0">
      <span className="text-sm text-white/80">{label}</span>
      {children}
    </div>
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "linear-gradient(to bottom, #240046, #10002B)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <AppIcon size={22} />
          <h1 className="font-black uppercase tracking-wide text-base"
            style={{ color: "#FF8C00", fontFamily: "Impact, Arial Black, sans-serif", WebkitTextStroke: "1px #3C096C" }}>
            SETTINGS
          </h1>
        </div>
        <button onClick={() => navigate("/")} className="p-2 rounded-full bg-white/10">
          <Camera className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {/* Recording */}
        <Section title="Recording">
          <Row label={`Buffer Duration: ${bufferMinutes} min`}>
            <div className="w-32">
              <Slider value={bufferMinutes} min={1} max={60} onChange={setBufferMinutes} />
            </div>
          </Row>
          <Row label="Video Quality">
            <div className="flex gap-1">
              {["480p", "720p", "1080p"].map((q) => (
                <button
                  key={q}
                  onClick={() => setVideoQuality(q)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    background: videoQuality === q ? "#FF8C00" : "rgba(255,255,255,0.1)",
                    color: "white",
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </Row>
          <Row label="Audio Recording"><Toggle value={audioEnabled} onChange={setAudioEnabled} /></Row>
          <Row label="Auto Save"><Toggle value={autoSave} onChange={setAutoSave} /></Row>
        </Section>

        {/* Storage */}
        <Section title="Storage">
          <Row label={`Max Saved Clips: ${maxClips}`}>
            <div className="w-32">
              <Slider value={maxClips} min={10} max={100} step={10} onChange={setMaxClips} />
            </div>
          </Row>
          <div className="px-4 py-3">
            <button
              onClick={handleDeleteAll}
              className="w-full py-2.5 rounded-xl text-sm font-bold transition-colors"
              style={{ background: deleteConfirm ? "#CC0000" : "rgba(255,30,0,0.2)", color: deleteConfirm ? "white" : "#FF4D4D" }}
            >
              <span className="flex items-center justify-center gap-2">
                <Trash2 className="w-4 h-4" />
                {deleteConfirm ? "Tap again to confirm delete" : "Delete All Saved Clips"}
              </span>
            </button>
          </div>
        </Section>

        {/* Preferences */}
        <Section title="App Preferences">
          <Row label="Notifications"><Toggle value={notifications} onChange={setNotifications} /></Row>
          <Row label="Sound Timer Bar"><Toggle value={soundTimerBar} onChange={setSoundTimerBar} /></Row>
        </Section>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
            style={{ background: saved ? "#22c55e" : "#FF8C00", color: "white" }}
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
      </div>
    </div>
  );
}
