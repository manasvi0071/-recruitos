export default function SaarthiLogo({ size = 40, showText = true }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="saarthiGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="50%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          <linearGradient id="saarthiGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
        </defs>

        {/* Outer ring — the "360" */}
        <circle cx="50" cy="50" r="44" fill="none" stroke="url(#saarthiGrad1)" strokeWidth="5" strokeLinecap="round" strokeDasharray="240 40" transform="rotate(-90 50 50)" />

        {/* Inner guiding arrow / compass needle — the "Saarthi" (guide) */}
        <path
          d="M50 26 L64 58 L50 50 L36 58 Z"
          fill="url(#saarthiGrad2)"
        />

        {/* Center dot */}
        <circle cx="50" cy="50" r="5" fill="#7C3AED" />

        {/* Small upward path accent */}
        <path
          d="M50 50 L50 74"
          stroke="url(#saarthiGrad1)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: size * 0.42,
            background: 'linear-gradient(135deg, #7C3AED, #F59E0B)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Saarthi<span style={{ fontStyle: 'italic' }}>360</span>
          </span>
        </div>
      )}
    </div>
  );
}