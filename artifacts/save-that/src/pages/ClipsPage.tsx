import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Download, Trash2, MoreVertical, Play, X, Film, Scissors } from "lucide-react";
import { AppIcon } from "@/components/AppIcon";
import { BottomNav } from "@/components/BottomNav";
import { TrimEditor } from "@/components/TrimEditor";
import { useSwipeNav } from "@/hooks/useSwipeNav";
import { clipStorage, StoredClip } from "@/utils/clipStorage";

function formatDuration(s: number): string {
  if (s < 60) return `${Math.round(s)}s`;
  return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTimestamp(d: Date): string {
  return d.toLocaleString(undefined, {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function ClipCard({
  clip, onPlay, onExport, onDelete, onTrim,
}: {
  clip: StoredClip;
  onPlay: () => void;
  onExport: () => void;
  onDelete: () => void;
  onTrim: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ background: "rgba(60,9,108,0.45)", border: "1px solid rgba(255,184,0,0.12)" }}>
      <div className="relative w-full aspect-video bg-black cursor-pointer group" onClick={onPlay}>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <Film className="w-8 h-8 text-white/20" />
          <span className="text-white/30 text-xs">{formatDuration(clip.duration)}</span>
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <Play className="w-6 h-6 text-white fill-white ml-0.5" />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between px-3 py-2.5">
        <div>
          <p className="text-white text-xs font-semibold">{formatTimestamp(clip.timestamp)}</p>
          <p className="text-white/45 text-xs">{formatDuration(clip.duration)} · {formatSize(clip.size)}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onTrim}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            title="Trim & export">
            <Scissors className="w-4 h-4" />
          </button>
          <button onClick={onExport}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            title="Download to device">
            <Download className="w-4 h-4" />
          </button>
          <div ref={menuRef} className="relative">
            <button onClick={() => setMenuOpen((v) => !v)}
              className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 bottom-10 z-50 rounded-xl overflow-hidden shadow-xl min-w-[140px]"
                style={{ background: "#2D0060", border: "1px solid rgba(255,184,0,0.15)" }}>
                <button onClick={() => { onTrim(); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-white hover:bg-white/10 transition-colors">
                  <Scissors className="w-4 h-4" /> Trim Clip
                </button>
                <button onClick={() => { onExport(); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-white hover:bg-white/10 transition-colors">
                  <Download className="w-4 h-4" /> Save to Device
                </button>
                <button onClick={() => { onDelete(); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-white/10 transition-colors">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClipsPage() {
  const [, navigate] = useLocation();
  const [clips, setClips] = useState<StoredClip[]>([]);
  const [activeClip, setActiveClip] = useState<StoredClip | null>(null);
  const [trimClip, setTrimClip] = useState<StoredClip | null>(null);
  const playerRef = useRef<HTMLVideoElement>(null);

  // Swipe right → Camera
  useSwipeNav({ onSwipeRight: () => navigate("/") });

  const refresh = () => setClips(clipStorage.getAll());

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener("clipSaved", handler);
    return () => window.removeEventListener("clipSaved", handler);
  }, []);

  useEffect(() => {
    const video = playerRef.current;
    if (!video) return;
    if (activeClip) {
      video.src = activeClip.url;
      video.load();
      video.play().catch(() => {});
    } else {
      video.pause();
      video.src = "";
    }
  }, [activeClip]);

  const handleExport = (clip: StoredClip) => {
    const ext = clip.mimeType.includes("mp4") ? "mp4" : "webm";
    const a = document.createElement("a");
    a.href = clip.url;
    a.download = `save-that-${clip.timestamp.getTime()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = (clip: StoredClip) => {
    if (activeClip?.id === clip.id) setActiveClip(null);
    if (trimClip?.id === clip.id) setTrimClip(null);
    clipStorage.delete(clip.id);
    refresh();
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden"
      style={{ background: "linear-gradient(to bottom, #240046, #10002B)" }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-3 shrink-0">
        <AppIcon size={22} />
        <h1 className="font-black uppercase tracking-wide text-base"
          style={{ color: "#7B2FBE", fontFamily: "Impact, Arial Black, sans-serif", WebkitTextStroke: "0.5px rgba(255,140,0,0.5)" }}>
          SAVED CLIPS
        </h1>
        <span className="ml-auto text-white/30 text-xs">
          {clips.length} clip{clips.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-3">
        {/* Inline video player */}
        {activeClip && !trimClip && (
          <div className="mb-4 rounded-xl overflow-hidden bg-black relative">
            <video ref={playerRef} className="w-full aspect-video" controls playsInline preload="auto" />
            <button onClick={() => setActiveClip(null)}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white z-10">
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center justify-between px-3 py-2"
              style={{ background: "rgba(60,9,108,0.8)" }}>
              <div className="text-xs text-white/60">
                {formatTimestamp(activeClip.timestamp)} · {formatDuration(activeClip.duration)}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setTrimClip(activeClip); setActiveClip(null); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                  style={{ background: "rgba(255,184,0,0.2)", color: "#FFB800" }}>
                  <Scissors className="w-3.5 h-3.5" /> Trim
                </button>
                <button onClick={() => handleExport(activeClip)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                  style={{ background: "#FFB800", color: "#1a0030" }}>
                  <Download className="w-3.5 h-3.5" /> Save
                </button>
                <button onClick={() => handleDelete(activeClip)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-red-700">
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Trim editor */}
        {trimClip && (
          <div className="mb-4">
            <TrimEditor
              url={trimClip.url}
              mimeType={trimClip.mimeType}
              filename={`save-that-${trimClip.timestamp.getTime()}`}
              onClose={() => setTrimClip(null)}
            />
          </div>
        )}

        {clips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-white/40">
            <Film className="w-14 h-14" />
            <p className="text-sm font-medium">No clips saved yet</p>
            <p className="text-xs text-center max-w-xs">
              Head back to the camera and tap a time button to save footage from the rolling buffer.
            </p>
            <button onClick={() => navigate("/")}
              className="mt-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: "#3C096C" }}>
              Open Camera
            </button>
            <p className="text-xs text-white/25 text-center">← Swipe right to go back to camera</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {clips.map((clip) => (
              <ClipCard
                key={clip.id}
                clip={clip}
                onPlay={() => { setTrimClip(null); setActiveClip(clip); }}
                onExport={() => handleExport(clip)}
                onDelete={() => handleDelete(clip)}
                onTrim={() => { setActiveClip(null); setTrimClip(clip); }}
              />
            ))}
          </div>
        )}
      </div>

      {/* SHARED BOTTOM NAV */}
      <BottomNav current="clips" />
    </div>
  );
}
