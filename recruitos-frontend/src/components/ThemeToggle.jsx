import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        border: '1.5px solid var(--border-default)',
        background: 'var(--bg-surface-2)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        transition: 'transform 0.3s ease, background 0.3s ease',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1) rotate(15deg)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1) rotate(0deg)'; }}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}