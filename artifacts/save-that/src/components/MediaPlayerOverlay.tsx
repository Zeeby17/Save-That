import { useState, useEffect } from "react";
import { SkipBack, SkipForward, Play, Pause, Music2, ChevronDown } from "lucide-react";

interface NowPlayingInfo {
  title: string;
  artist: string;
  album?: string;
}

function sendMediaKey(key: string) {
  // Dispatch keyboard media events — the browser/OS forwards them to the active media player
  const evt = new KeyboardEvent("keydown", {
    key,
    code: key,
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(evt);
}

function pollNowPlaying(): NowPlayingInfo | null {
  try {
    const session = (navigator as Navigator & { mediaSession?: MediaSession }).mediaSession;
    if (session?.metadata) {
      return {
        title: session.metadata.title || "Unknown Title",
        artist: session.metadata.artist || "Unknown Artist",
        album: session.metadata.album,
      };
    }
  } catch {
    // ignore
  }
  return null;
}

interface MediaPlayerOverlayProps {
  visible: boolean;
  onClose: () => void;
}

export function MediaPlayerOverlay({ visible, onClose }: MediaPlayerOverlayProps) {
  const [nowPlaying, setNowPlaying] = useState<NowPlayingInfo | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!visible) return;
    const poll = () => setNowPlaying(pollNowPlaying());
    poll();
    const id = setInterval(poll, 2000);
    return () => clearInterval(id);
  }, [visible]);

  if (!visible) return null;

  const handlePlayPause = () => {
    sendMediaKey("MediaPlayPause");
    setIsPlaying((v) => !v);
  };

  return (
    <div
      className="absolute left-3 bottom-16 z-50 rounded-2xl overflow-hidden"
      style={{
        background: "rgba(15,0,40,0.88)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,184,0,0.3)",
        width: "220px",
      }}
    >
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
        <div className="flex items-center gap-1.5">
          <Music2 className="w-3.5 h-3.5" style={{ color: "#FFB800" }} />
          <span className="text-xs font-bold text-white/70">Now Playing</span>
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white p-0.5">
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {nowPlaying ? (
        <div className="px-3 pb-1">
          <p className="text-white text-sm font-bold leading-tight truncate">{nowPlaying.title}</p>
          <p className="text-white/50 text-xs truncate">{nowPlaying.artist}</p>
        </div>
      ) : (
        <div className="px-3 pb-1">
          <p className="text-white/40 text-xs">Play music in another app</p>
          <p className="text-white/25 text-xs">Controls will appear here</p>
        </div>
      )}

      <div className="flex items-center justify-center gap-3 px-3 py-2.5">
        <button
          onClick={() => sendMediaKey("MediaPreviousTrack")}
          className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white active:scale-90"
        >
          <SkipBack className="w-5 h-5 fill-current" />
        </button>
        <button
          onClick={handlePlayPause}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: "#FFB800" }}
        >
          {isPlaying
            ? <Pause className="w-5 h-5 fill-current text-black" />
            : <Play className="w-5 h-5 fill-current text-black ml-0.5" />
          }
        </button>
        <button
          onClick={() => sendMediaKey("MediaNextTrack")}
          className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white active:scale-90"
        >
          <SkipForward className="w-5 h-5 fill-current" />
        </button>
      </div>
    </div>
  );
}

// Thin "now playing" bar at the bottom of the video — shown when a song is detected
export function NowPlayingBar() {
  const [info, setInfo] = useState<NowPlayingInfo | null>(null);

  useEffect(() => {
    const poll = () => setInfo(pollNowPlaying());
    poll();
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, []);

  if (!info) return null;

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
      style={{ background: "rgba(15,0,40,0.65)", backdropFilter: "blur(8px)" }}
    >
      <Music2 className="w-3.5 h-3.5 shrink-0" style={{ color: "#FFB800" }} />
      <span className="text-white text-xs font-medium truncate">
        {info.title} — {info.artist}
      </span>
    </div>
  );
}
