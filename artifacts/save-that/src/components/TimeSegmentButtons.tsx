import { AlarmClock, Plus } from "lucide-react";

interface TimeSegmentButtonsProps {
  onSave: (seconds: number) => void;
  isTimeLapse?: boolean;
  onToggleTimeLapse?: () => void;
  customSeconds?: number;
}

const SEGMENTS = [
  { label: "10s", seconds: 10 },
  { label: "20s", seconds: 20 },
  { label: "30s", seconds: 30 },
  { label: "1m", seconds: 60 },
  { label: "2m", seconds: 120 },
  { label: "5m", seconds: 300 },
];

export function TimeSegmentButtons({
  onSave,
  isTimeLapse = false,
  onToggleTimeLapse,
  customSeconds,
}: TimeSegmentButtonsProps) {
  const customLabel =
    customSeconds && customSeconds > 0
      ? customSeconds < 60
        ? `${customSeconds}s`
        : `${Math.floor(customSeconds / 60)}m${customSeconds % 60 > 0 ? ` ${customSeconds % 60}s` : ""}`
      : null;

  return (
    <div className="flex flex-col gap-1 w-full">
      <p className="text-white/60 text-xs font-medium text-center">Save Last</p>
      <div className="flex gap-1.5 justify-center items-center flex-wrap">
        {/* Time lapse toggle — yellow alarm clock */}
        <button
          onClick={onToggleTimeLapse}
          className="px-2.5 py-2 rounded-lg text-sm font-bold active:scale-95 transition-all flex items-center gap-1"
          style={{
            backgroundColor: isTimeLapse ? "#FFD700" : "rgba(255,215,0,0.2)",
            color: isTimeLapse ? "#1a0030" : "#FFD700",
            border: `1px solid ${isTimeLapse ? "#FFD700" : "rgba(255,215,0,0.4)"}`,
          }}
          title="Time Lapse Mode"
        >
          <AlarmClock className="w-4 h-4" />
          {isTimeLapse && <span className="text-xs">5fps</span>}
        </button>

        {/* Standard save buttons */}
        {SEGMENTS.map((seg) => (
          <button
            key={seg.label}
            onClick={() => onSave(seg.seconds)}
            className="px-3 py-2 rounded-lg text-white text-sm font-bold active:scale-95 transition-transform"
            style={{ backgroundColor: "#FF1E00" }}
          >
            {seg.label}
          </button>
        ))}

        {/* Custom time button */}
        <button
          onClick={() => customSeconds && customSeconds > 0 && onSave(customSeconds)}
          disabled={!customSeconds || customSeconds <= 0}
          className="px-2.5 py-2 rounded-lg text-sm font-bold active:scale-95 transition-all flex items-center gap-1 disabled:opacity-40"
          style={{
            backgroundColor: "#FF8C00",
            color: "white",
          }}
          title={customSeconds ? `Save last ${customLabel}` : "Set custom time in Settings"}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{customLabel ?? "Custom"}</span>
        </button>
      </div>
    </div>
  );
}
