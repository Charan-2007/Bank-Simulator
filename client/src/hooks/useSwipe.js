import { useRef, useEffect } from 'react';

/**
 * Hook for swipe navigation between sections
 * Follows sequential tab adjacency order:
 * Home (0) -> Cards (1) -> Pay (2) -> Passbook (3) -> Profile (4)
 * Swipes can START ONLY on Home (0), Passbook (3), and Profile (4).
 */
export function useSwipe({ activeIndex, onSelectTab, enabled = true }) {
  const touchStartRef = useRef(null);
  const isValidStartRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const onTouchStart = (e) => {
      // 1. Gesture can start ONLY on Home (0), Passbook (3), and Profile (4)
      if (activeIndex !== 0 && activeIndex !== 3 && activeIndex !== 4) {
        isValidStartRef.current = false;
        return;
      }

      const touch = e.touches[0];
      if (!touch) return;

      // 2. 24px edge dead zone to avoid fighting Android back gestures
      const edgeThreshold = 24;
      if (touch.clientX <= edgeThreshold || touch.clientX >= window.innerWidth - edgeThreshold) {
        isValidStartRef.current = false;
        return;
      }

      // 3. Do not initiate swipe on form elements or interactive modal overlays
      const target = e.target;
      if (
        target.closest('input, textarea, select, button, [data-no-swipe], [role="dialog"], [role="tablist"]')
      ) {
        isValidStartRef.current = false;
        return;
      }

      isValidStartRef.current = true;
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };
    };

    const onTouchEnd = (e) => {
      if (!isValidStartRef.current || !touchStartRef.current) return;
      const touch = e.changedTouches[0];
      if (!touch) return;

      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const elapsed = Date.now() - touchStartRef.current.time;

      isValidStartRef.current = false;
      touchStartRef.current = null;

      // Minimum swipe distance of 50px, duration < 500ms
      if (Math.abs(deltaX) < 50 || elapsed > 500) return;

      // 4. Horizontal-dominance axis lock (horizontal >= 1.5 * vertical)
      if (Math.abs(deltaX) < 1.5 * Math.abs(deltaY)) return;

      // 5. Evaluate sequential transitions:
      if (deltaX < 0) {
        // Swipe Left (advance forward)
        if (activeIndex === 0) {
          onSelectTab(1); // Home -> Cards
        } else if (activeIndex === 3) {
          onSelectTab(4); // Passbook -> Profile
        }
      } else if (deltaX > 0) {
        // Swipe Right (step backward)
        if (activeIndex === 3) {
          onSelectTab(2); // Passbook -> Pay
        } else if (activeIndex === 4) {
          onSelectTab(3); // Profile -> Passbook
        }
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [activeIndex, onSelectTab, enabled]);
}

export default useSwipe;
