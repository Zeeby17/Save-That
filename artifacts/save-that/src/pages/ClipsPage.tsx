import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Camera, Download, Trash2, MoreVertical, Play, X, Film } from "lucide-react";
import { AppIcon } from "@/components/AppIcon";
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
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ClipThumbnail({ clip, onClick }: { clip: StoredClip; onClick: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.src = clip.url;
    video.currentTime = clip.duration * 0.5;
    const handler = () => setLoaded(true);
    video.addEventListener("loadeddata", handler);
    return () => video.removeEventListener("loadeddata", handler);
  }, [clip]);

  return (
    <div
      className="relative w-full aspect-video bg-black/60 rounded-lg overflow-hidden cursor-pointer"
      onClick={onClick}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        muted
        playsInline
        preload="metadata"
      />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Film className="w-8 h-8 text-white/30" />
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30">
        <Play className="w-10 h-10 text-white fill-white" />
      </div>
    </div>
  );
}

export default function ClipsPage() {
  const [, navigate] = useLocation();
  const [clips, setClips] = useState<StoredClip[]>([]);
  const [activeClip, setActiveClip] = useState<StoredClip | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const playerRef = useRef<HTMLVideoElement>(null);

  const refresh = () => setClips(clipStorage.getAll());

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener("clipSaved", handler);
    return () => window.removeEventListener("clipSaved", handler);
  }, []);

  useEffect(() => {
    if (activeClip && playerRef.current) {
      playerRef.current.src = activeClip.url;
      playerRef.current.play().catch(() => {});
    }
  }, [activeClip]);

  const handleExport = (clip: StoredClip) => {
    const a = document.createElement("a");
    a.href = clip.url;
    a.download = `save-that-${clip.timestamp.getTime()}.webm`;
    a.click();
  };

  const handleDelete = (clip: StoredClip) => {
    if (activeClip?.id === clip.id) setActiveClip(null);
    clipStorage.delete(clip.id);
    refresh();
    setMenuOpenId(null);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "linear-gradient(to bottom, #240046, #10002B)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <AppIcon size={22} />
          <h1
            className="font-black uppercase tracking-wide text-base"
            style={{ color: "#FF8C00", fontFamily: "Impact, Arial Black, sans-serif", WebkitTextStroke: "1px #3C096C" }}
          >
            TIME SEGMENTS
          </h1>
        </div>
        <button onClick={() => navigate("/")} className="p-2 rounded-full bg-white/10">
          <Camera className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {/* Video player */}
        {activeClip && (
          <div className="mb-4 rounded-xl overflow-hidden bg-black relative">
            <video
              ref={playerRef}
              className="w-full aspect-video"
              controls
              playsInline
            />
            <button
              onClick={() => setActiveClip(null)}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <div className="flex items-center justify-between px-3 py-2 bg-black/60">
              <div className="text-xs text-white/60">
                {formatTimestamp(activeClip.timestamp)} · {formatDuration(activeClip.duration)} · {formatSize(activeClip.size)}
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleExport(activeClip)} className="p-1.5 rounded-lg bg-white/10 text-white">
                  <Download className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(activeClip)} className="p-1.5 rounded-lg bg-red-600/80 text-white">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {clips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-white/40">
            <Film className="w-14 h-14" />
            <p className="text-sm font-medium">No clips saved yet</p>
            <p className="text-xs text-center max-w-xs">
              Head back to the camera and tap one of the time buttons to save footage.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {clips.map((clip) => (
              <div
                key={clip.id}
                className="rounded-xl overflow-hidden"
                style={{ background: "rgba(60,9,108,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <ClipThumbnail clip={clip} onClick={() => setActiveClip(clip)} />
                <div className="px-3 py-2 flex items-center justify-between">
                  <div>
                    <p className="text-white text-xs font-medium">{formatTimestamp(clip.timestamp)}</p>
                    <p className="text-white/50 text-xs">
                      {formatDuration(clip.duration)} · {formatSize(clip.size)}
                    </p>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpenId(menuOpenId === clip.id ? null : clip.id)}
                      className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {menuOpenId === clip.id && (
                      <div
                        className="absolute right-0 bottom-9 z-50 rounded-xl overflow-hidden shadow-xl min-w-[140px]"
                        style={{ background: "#2D0060" }}
                      >
                        <button
                          onClick={() => { handleExport(clip); setMenuOpenId(null); }}
                          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-white hover:bg-white/10 transition-colors"
                        >
                          <Download className="w-4 h-4" /> Export
                        </button>
                        <button
                          onClick={() => handleDelete(clip)}
                          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-white/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
