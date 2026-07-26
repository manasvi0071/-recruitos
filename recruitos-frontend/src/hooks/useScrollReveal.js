import { useEffect, useRef, useState } from 'react';

// Tracks how far a section has scrolled through the viewport (0 = just entering, 1 = fully passed)
export function useScrollProgress() {
  const ref = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function onScroll() {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when top of element is at bottom of viewport, 1 when bottom of element is at top
      const raw = 1 - (rect.top + rect.height) / (vh + rect.height);
      setProgress(Math.min(1, Math.max(0, raw)));
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return [ref, progress];
}

// Simple global scroll Y tracker, for parallax layers
export function useScrollY() {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    function onScroll() { setScrollY(window.scrollY); }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return scrollY;
}