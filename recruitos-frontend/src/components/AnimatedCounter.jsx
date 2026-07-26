import { useEffect, useRef, useState } from 'react';

// Extracts the numeric part and any suffix, e.g. "900+" → 900, "+"
function parseValue(str) {
  const match = str.match(/^([\d,]+)(.*)$/);
  if (!match) return { num: 0, suffix: str };
  return { num: parseInt(match[1].replace(/,/g, ''), 10), suffix: match[2] };
}

export default function AnimatedCounter({ value, duration = 1500 }) {
  const { num, suffix } = parseValue(value);
  const [display, setDisplay] = useState(0);
  const [done, setDone] = useState(false);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          function tick(now) {
            const elapsed = now - start;
            const progress = Math.min(1, elapsed / duration);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(num * eased));
            if (progress < 1) {
              requestAnimationFrame(tick);
            } else {
              setDone(true);
            }
          }
          requestAnimationFrame(tick);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [num, duration]);

  return (
    <span ref={ref} className={done ? 'count-pop' : ''}>
      {display.toLocaleString()}{suffix}
    </span>
  );
}