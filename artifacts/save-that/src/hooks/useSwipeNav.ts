import { useEffect } from "react";

type Direction = "left" | "right";

interface SwipeNavConfig {
  onSwipeLeft?: () => void;   // swipe left → next page (toward Clips)
  onSwipeRight?: () => void;  // swipe right → prev page (toward Settings)
  threshold?: number;
}

// Detects horizontal swipe gestures for page navigation.
// Ignores vertical-dominant swipes and range input drags.
export function useSwipeNav({ onSwipeLeft, onSwipeRight, threshold = 55 }: SwipeNavConfig) {
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let startTarget: EventTarget | null = null;

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startTarget = e.target;
    };

    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;

      // Ignore if vertical-dominant, or if touch started on a range input
      if (Math.abs(dy) > Math.abs(dx)) return;
      if ((startTarget as HTMLElement)?.tagName === "INPUT") return;
      if (Math.abs(dx) < threshold) return;

      const dir: Direction = dx < 0 ? "left" : "right";
      if (dir === "left") onSwipeLeft?.();
      else onSwipeRight?.();
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, threshold]);
}
