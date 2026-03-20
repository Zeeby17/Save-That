interface TimeSegmentButtonsProps {
  onSave: (seconds: number) => void;
}

const SEGMENTS = [
  { label: "10s", seconds: 10 },
  { label: "20s", seconds: 20 },
  { label: "30s", seconds: 30 },
  { label: "1m", seconds: 60 },
  { label: "2m", seconds: 120 },
  { label: "5m", seconds: 300 },
];

export function TimeSegmentButtons({ onSave }: TimeSegmentButtonsProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <p className="text-white/60 text-xs font-medium text-center">Save Last</p>
      <div className="flex gap-1.5 justify-center flex-wrap">
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
      </div>
    </div>
  );
}
