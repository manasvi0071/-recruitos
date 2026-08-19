import { useState } from 'react';
import logoImg from '../assets/saarthi-logo-transparent.png';

export default function SaarthiLogo({ size = 46, width }) {
  const [imageError, setImageError] = useState(false);

  // Use the PNG logo when available
  if (!imageError) {
    return (
      <img
        src={logoImg}
        alt="Saarthi Campus"
        className="theme-adaptive-logo"
        onError={() => setImageError(true)}
        style={{
          height: size,
          width: width || 'auto',
          objectFit: width ? 'fill' : 'contain',
          display: 'block',
        }}
      />
    );
  }

  // SVG fallback
  return (
    <svg
      width={width || size}
      height={size}
      viewBox="0 0 46 46"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Saarthi logo"
      role="img"
    >
      <rect
        x="1"
        y="1"
        width="44"
        height="44"
        rx="14"
        fill="#EEE7FF"
      />

      <path
        d="M14 28.5C17.2 32.2 23.1 33.2 28.5 30.7C33.5 28.4 34.1 23.6 30.8 21.1C28.8 19.6 26.5 19.4 24.3 19.8C21.8 20.3 19.8 19.5 19.2 17.9C18.5 16 20.7 14.2 23.1 14"
        stroke="#6327BD"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      <path
        d="M13.5 19.5C15.2 17 17.1 15.1 20 14"
        stroke="#A778F3"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      <circle
        cx="31.5"
        cy="14.5"
        r="2.5"
        fill="#6327BD"
      />
    </svg>
  );
}