export function AppIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="4" y="1" width="16" height="22" rx="3" fill="#3C096C" stroke="#5A189A" strokeWidth="1" />
      <ellipse cx="12" cy="7" rx="5" ry="4" fill="#240046" />
      <ellipse cx="12" cy="17" rx="5" ry="4" fill="#240046" />
      <path d="M8 8 Q10 12 12 12 Q14 12 16 16" stroke="#FF8C00" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="10" r="1" fill="#FF8C00" opacity="0.8" />
      <circle cx="13" cy="14" r="0.8" fill="#FF7E36" opacity="0.7" />
      <circle cx="11" cy="16" r="0.6" fill="#FF8C00" opacity="0.6" />
    </svg>
  );
}
