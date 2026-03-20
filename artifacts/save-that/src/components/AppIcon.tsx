// Standalone hourglass icon — orange sand, purple frame
export function AppIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Top frame rim */}
      <rect x="2" y="1" width="36" height="5" rx="2.5" fill="#FF8C00" />
      {/* Bottom frame rim */}
      <rect x="2" y="42" width="36" height="5" rx="2.5" fill="#FF8C00" />
      {/* Left side struts */}
      <rect x="2" y="6" width="5" height="36" rx="2" fill="#FF8C00" />
      {/* Right side struts */}
      <rect x="33" y="6" width="5" height="36" rx="2" fill="#FF8C00" />

      {/* Top sand bulk */}
      <path d="M7 6 L33 6 L26 22 L20 24 L14 22 Z" fill="#FFB800" />
      {/* Top sand highlight */}
      <path d="M10 7 L30 7 L25 19 L20 21 L15 19 Z" fill="#FFD700" opacity="0.6" />

      {/* Neck / pinch */}
      <ellipse cx="20" cy="24" rx="3" ry="2" fill="#FF8C00" />

      {/* Bottom sand pile */}
      <path d="M14 26 L20 24 L26 26 L29 42 L11 42 Z" fill="#FFB800" />
      {/* Bottom sand surface highlight */}
      <ellipse cx="20" cy="42" rx="9" ry="2" fill="#FFD700" opacity="0.55" />

      {/* Sand stream falling through neck */}
      <line x1="20" y1="21" x2="20" y2="26" stroke="#FF6600" strokeWidth="2" strokeLinecap="round" />

      {/* Sand particles in top chamber */}
      <circle cx="15" cy="12" r="1.5" fill="#FF6600" opacity="0.7" />
      <circle cx="25" cy="10" r="1.5" fill="#FF6600" opacity="0.7" />
      <circle cx="20" cy="15" r="1.2" fill="#FF8C00" opacity="0.6" />
    </svg>
  );
}

// Video watermark — top-left corner badge: orange hourglass + purple "SAVE THAT"
export function Watermark() {
  return (
    <div
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 select-none pointer-events-none"
      style={{
        background: "rgba(20, 0, 50, 0.52)",
        backdropFilter: "blur(6px)",
        border: "1px solid rgba(255,140,0,0.3)",
      }}
    >
      <AppIcon size={20} />
      <span
        style={{
          fontFamily: "Impact, Arial Black, sans-serif",
          fontSize: "13px",
          color: "#7B2FBE",
          WebkitTextStroke: "0.5px rgba(255,140,0,0.6)",
          letterSpacing: "0.06em",
          fontWeight: 900,
          lineHeight: 1,
          textShadow: "0 0 8px rgba(123,47,190,0.8)",
        }}
      >
        SAVE THAT
      </span>
    </div>
  );
}
