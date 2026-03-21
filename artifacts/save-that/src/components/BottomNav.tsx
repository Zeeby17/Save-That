import { useLocation } from "wouter";
import { Settings, Camera, Film } from "lucide-react";

type Page = "camera" | "clips" | "settings";

interface BottomNavProps {
  current: Page;
}

export function BottomNav({ current }: BottomNavProps) {
  const [, navigate] = useLocation();

  const items: { id: Page; icon: React.ReactNode; label: string; path: string }[] = [
    {
      id: "settings",
      icon: <Settings className="w-5 h-5" />,
      label: "Settings",
      path: "/settings",
    },
    {
      id: "camera",
      icon: <Camera className="w-5 h-5" />,
      label: "Camera",
      path: "/",
    },
    {
      id: "clips",
      icon: <Film className="w-5 h-5" />,
      label: "Saved Clips",
      path: "/clips",
    },
  ];

  return (
    <div
      className="flex items-center justify-around px-2 py-2 shrink-0"
      style={{
        borderTop: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(10,0,30,0.7)",
        backdropFilter: "blur(12px)",
      }}
    >
      {items.map((item) => {
        const active = item.id === current;
        return (
          <button
            key={item.id}
            onClick={() => !active && navigate(item.path)}
            className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all active:scale-90"
            style={{
              color: active ? "#FFB800" : "rgba(255,255,255,0.35)",
              background: active ? "rgba(255,184,0,0.1)" : "transparent",
              minWidth: "72px",
            }}
          >
            {item.icon}
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
