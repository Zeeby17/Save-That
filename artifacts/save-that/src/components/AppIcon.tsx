// Hourglass icon — orange sand, dark purple frame
export function AppIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Top/bottom frame rims */}
      <rect x="2" y="1" width="36" height="5" rx="2.5" fill="#FF8C00" />
      <rect x="2" y="42" width="36" height="5" rx="2.5" fill="#FF8C00" />
      {/* Side struts */}
      <rect x="2" y="6" width="5" height="36" rx="2" fill="#FF8C00" />
      <rect x="33" y="6" width="5" height="36" rx="2" fill="#FF8C00" />
      {/* Top sand bulk */}
      <path d="M7 6 L33 6 L26 22 L20 24 L14 22 Z" fill="#FFB800" />
      <path d="M10 7 L30 7 L25 19 L20 21 L15 19 Z" fill="#FFD700" opacity="0.5" />
      {/* Neck */}
      <ellipse cx="20" cy="24" rx="3" ry="2" fill="#FF8C00" />
      {/* Bottom sand pile */}
      <path d="M14 26 L20 24 L26 26 L29 42 L11 42 Z" fill="#FFB800" />
      <ellipse cx="20" cy="42" rx="9" ry="2" fill="#FFD700" opacity="0.5" />
      {/* Sand stream */}
      <line x1="20" y1="21" x2="20" y2="26" stroke="#FF6600" strokeWidth="2.5" strokeLinecap="round" />
      {/* Top particles */}
      <circle cx="14" cy="11" r="1.5" fill="#FF6600" opacity="0.75" />
      <circle cx="25" cy="10" r="1.5" fill="#FF6600" opacity="0.75" />
      <circle cx="20" cy="14" r="1.2" fill="#FF8C00" opacity="0.6" />
    </svg>
  );
}

// Watermark overlay — always top-left of the live video feed.
// This is a visual overlay on the preview only; watermark is NOT burned into
// downloaded files (that requires canvas-based recording, a future feature).
export function Watermark() {
  return (
    <div
      className="flex items-center gap-2 rounded-xl select-none pointer-events-none"
      style={{
        background: "rgba(15, 0, 40, 0.68)",
        backdropFilter: "blur(8px)",
        border: "1.5px solid rgba(255,140,0,0.45)",
        padding: "6px 12px 6px 8px",
      }}
    >
      <AppIcon size={26} />
      <span
        style={{
          fontFamily: "Impact, Arial Black, sans-serif",
          fontSize: "16px",
          color: "#6A0DAD",
          WebkitTextStroke: "1px rgba(255,140,0,0.7)",
          letterSpacing: "0.08em",
          fontWeight: 900,
          lineHeight: 1,
          textShadow: "0 0 12px rgba(106,13,173,0.9), 0 0 4px rgba(255,140,0,0.5)",
        }}
      >
        SAVE THAT
      </span>
    </div>
  );
}
