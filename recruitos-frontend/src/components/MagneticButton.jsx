import { useRef, useState } from 'react';

export default function MagneticButton({ children, className, style, onClick }) {
  const ref = useRef(null);
  const [transform, setTransform] = useState('translate(0,0)');

  function handleMove(e) {
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.3;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.3;
    setTransform(`translate(${x}px, ${y}px)`);
  }

  return (
    <button
      ref={ref}
      className={`magnetic-btn ${className || ''}`}
      style={{ ...style, transform }}
      onMouseMove={handleMove}
      onMouseLeave={() => setTransform('translate(0,0)')}
      onClick={onClick}
    >
      {children}
    </button>
  );
}