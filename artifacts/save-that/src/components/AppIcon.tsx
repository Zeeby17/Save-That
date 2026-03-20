export function AppIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer frame - purple */}
      <rect x="8" y="1" width="16" height="30" rx="3" fill="#3C096C" stroke="#7B2FBE" strokeWidth="1.2" />
      {/* Top bulb */}
      <ellipse cx="16" cy="8" rx="6" ry="5" fill="#5A189A" />
      {/* Bottom bulb */}
      <ellipse cx="16" cy="24" rx="6" ry="5" fill="#5A189A" />
      {/* Neck pinch lines */}
      <path d="M10 13 Q16 16 22 13" stroke="#7B2FBE" strokeWidth="0.8" fill="none" />
      <path d="M10 19 Q16 16 22 19" stroke="#7B2FBE" strokeWidth="0.8" fill="none" />
      {/* Gold sand stream */}
      <path d="M14 9 Q15 12 16 16 Q17 20 18 23" stroke="#FFB800" strokeWidth="2" strokeLinecap="round" />
      {/* Gold sand particles top */}
      <circle cx="13" cy="7" r="1.2" fill="#FFD700" />
      <circle cx="16" cy="6" r="1" fill="#FFB800" />
      <circle cx="19" cy="7" r="1.2" fill="#FFD700" />
      {/* Gold sand pool bottom */}
      <ellipse cx="16" cy="23" rx="4" ry="1.5" fill="#FFB800" opacity="0.85" />
      <circle cx="14.5" cy="21.5" r="0.8" fill="#FFD700" opacity="0.7" />
      <circle cx="17.5" cy="21" r="0.6" fill="#FFD700" opacity="0.6" />
    </svg>
  );
}

// Watermark overlay: gold hourglass + "SAVE THAT" in purple tones
// Rendered as a corner badge on the video feed
export function Watermark() {
  return (
    <div
      className="flex items-center gap-1 rounded-lg px-2 py-1 select-none pointer-events-none"
      style={{
        background: "rgba(36, 0, 70, 0.55)",
        backdropFilter: "blur(4px)",
        border: "1px solid rgba(255,184,0,0.25)",
      }}
    >
      <AppIcon size={16} />
      <span
        style={{
          fontFamily: "Impact, Arial Black, sans-serif",
          fontSize: "11px",
          color: "#FFB800",
          WebkitTextStroke: "0.5px #3C096C",
          letterSpacing: "0.04em",
          fontWeight: 900,
          lineHeight: 1,
        }}
      >
        SAVE THAT
      </span>
    </div>
  );
}
