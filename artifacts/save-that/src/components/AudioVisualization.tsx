const TIME_MARKERS = [
  { label: "60s", offset: 0 },
  { label: "45s", offset: 0.25 },
  { label: "30s", offset: 0.5 },
  { label: "15s", offset: 0.75 },
  { label: "now", offset: 1 },
];

interface AudioVisualizationProps {
  audioData: number[];
}

export function AudioVisualization({ audioData }: AudioVisualizationProps) {
  return (
    <div className="relative w-full h-14 mb-2">
      <div className="flex items-end h-10 w-full gap-px">
        {audioData.map((value, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm"
            style={{
              height: `${Math.max(4, value * 100)}%`,
              backgroundColor: `rgba(255, 30, 0, ${0.3 + value * 0.7})`,
              minWidth: "1px",
            }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1 px-0.5">
        {TIME_MARKERS.map((m) => (
          <span key={m.label} className="text-[9px] text-white/50 font-mono">
            {m.label}
          </span>
        ))}
      </div>
    </div>
  );
}
