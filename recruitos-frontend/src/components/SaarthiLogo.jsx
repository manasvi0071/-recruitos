import { useId } from "react";

export default function SaarthiLogo({
  width = "100%",
  height = "auto",
  showText = true,
  showTagline = true,
  darkMode = false,
}) {
  const uid = useId().replace(/:/g, "");

  const ids = {
    sGradient: `saarthi-s-${uid}`,
    cGradient: `saarthi-c-${uid}`,
    pathGradient: `saarthi-path-${uid}`,
    capGradient: `saarthi-cap-${uid}`,
    textGradient: `saarthi-text-${uid}`,
    peopleGradient: `saarthi-people-${uid}`,
    glow: `saarthi-glow-${uid}`,
    softGlow: `saarthi-soft-glow-${uid}`,
    shadow: `saarthi-shadow-${uid}`,
  };

  const viewBox = showText
    ? "0 0 760 220"
    : "0 0 290 220";

  return (
    <svg
      className="saarthi-campus-logo"
      width={width}
      height={height}
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby={`saarthi-title-${uid} saarthi-description-${uid}`}
      preserveAspectRatio="xMinYMid meet"
      style={{
        display: "block",
        maxWidth: "100%",
        overflow: "visible",
      }}
    >
      <title id={`saarthi-title-${uid}`}>
        Saarthi Campus
      </title>

      <desc id={`saarthi-description-${uid}`}>
        Saarthi Campus connects students, colleges, and recruiters through a
        guided career journey.
      </desc>

      <defs>
        {/* Main S gradient */}
        <linearGradient
          id={ids.sGradient}
          x1="45"
          y1="25"
          x2="175"
          y2="185"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="38%" stopColor="#A855F7" />
          <stop offset="70%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>

        {/* C gradient */}
        <linearGradient
          id={ids.cGradient}
          x1="150"
          y1="35"
          x2="275"
          y2="175"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="42%" stopColor="#2563EB" />
          <stop offset="75%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>

        {/* Career route gradient */}
        <linearGradient
          id={ids.pathGradient}
          x1="20"
          y1="195"
          x2="240"
          y2="45"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="34%" stopColor="#2563EB" />
          <stop offset="68%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>

        {/* Graduation cap */}
        <linearGradient
          id={ids.capGradient}
          x1="170"
          y1="15"
          x2="250"
          y2="65"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="52%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>

        {/* Visible people gradient */}
        <linearGradient
          id={ids.peopleGradient}
          x1="170"
          y1="90"
          x2="245"
          y2="140"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#d41bed" />
          <stop offset="42%" stopColor="#478186" />
          <stop offset="72%" stopColor="#A5B4FC" />
          <stop offset="100%" stopColor="#E9D5FF" />
        </linearGradient>

        {/* Wordmark gradient */}
        <linearGradient
          id={ids.textGradient}
          x1="345"
          y1="135"
          x2="650"
          y2="135"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="42%" stopColor="#06B6D4" />
          <stop offset="75%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>

        {/* Stronger glow for major elements */}
        <filter
          id={ids.glow}
          x="-70%"
          y="-70%"
          width="240%"
          height="240%"
        >
          <feGaussianBlur
            in="SourceGraphic"
            stdDeviation="4"
            result="blur"
          />

          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Softer glow for small details */}
        <filter
          id={ids.softGlow}
          x="-100%"
          y="-100%"
          width="300%"
          height="300%"
        >
          <feGaussianBlur
            in="SourceGraphic"
            stdDeviation="1.8"
            result="blur"
          />

          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter
          id={ids.shadow}
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feDropShadow
            dx="0"
            dy="7"
            stdDeviation="7"
            floodColor="#0B1020"
            floodOpacity="0.35"
          />
        </filter>
      </defs>

      {/* Open futuristic frame */}
      <path
        d="M58 33C91 8 136 7 169 22"
        stroke="#A855F7"
        strokeOpacity="0.38"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M246 48C278 78 282 126 258 159"
        stroke="#06B6D4"
        strokeOpacity="0.34"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M238 184C200 207 146 209 109 190"
        stroke="#2563EB"
        strokeOpacity="0.28"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Main S */}
      <path
        d="
          M164 57
          C154 39 126 34 101 43
          C77 51 75 71 98 82
          L133 99
          C157 110 156 133 134 145
          C108 159 78 153 63 134
        "
        stroke={`url(#${ids.sGradient})`}
        strokeWidth="30"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${ids.glow})`}
      />

      {/* S glass highlight */}
      <path
        d="
          M156 57
          C145 45 127 43 108 49
          C96 53 91 62 96 68
        "
        stroke="#FFFFFF"
        strokeOpacity="0.34"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* C around the S */}
      <path
        d="
          M242 59
          C224 40 195 36 173 48
          C153 59 143 79 146 101
          C149 128 169 150 194 155
          C216 159 237 151 250 134
        "
        stroke={`url(#${ids.cGradient})`}
        strokeWidth="18"
        strokeLinecap="round"
        filter={`url(#${ids.glow})`}
      />

      {/* C highlight */}
      <path
        d="M230 57C211 45 188 47 173 60"
        stroke="#FFFFFF"
        strokeOpacity="0.34"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Graduation cap */}
      <path
        d="M172 39L209 21L246 39L209 57L172 39Z"
        fill={`url(#${ids.capGradient})`}
        filter={`url(#${ids.shadow})`}
      />

      <path
        d="M184 46V59C198 68 220 68 234 59V46"
        stroke="#542f5e"
        strokeOpacity="0.82"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M246 39V59"
        stroke="#FACC15"
        strokeWidth="3"
        strokeLinecap="round"
      />

      <path
        d="M246 59C251 59 255 62 255 66"
        stroke="#FACC15"
        strokeWidth="3"
        strokeLinecap="round"
      />

      <circle
        cx="255"
        cy="68"
        r="3"
        fill="#FACC15"
        filter={`url(#${ids.softGlow})`}
      />

      {/* Community background halo */}
      <path
        d="M166 91C181 78 224 78 250 94"
        stroke="#FFFFFF"
        strokeOpacity="0.12"
        strokeWidth="14"
        strokeLinecap="round"
      />

      {/* Left person */}
      <circle
        cx="181"
        cy="105"
        r="7"
        fill={`url(#${ids.peopleGradient})`}
        filter={`url(#${ids.softGlow})`}
      />

      <path
        d="M172 131C172 121 177 116 185 116C193 116 198 121 198 131"
        stroke={`url(#${ids.peopleGradient})`}
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Center person */}
      <circle
        cx="207"
        cy="101"
        r="9"
        fill={`url(#${ids.peopleGradient})`}
        filter={`url(#${ids.softGlow})`}
      />

      <path
        d="M194 136C194 122 199 114 207 114C215 114 221 122 221 136"
        stroke={`url(#${ids.peopleGradient})`}
        strokeWidth="7"
        strokeLinecap="round"
      />

      {/* Right person */}
      <circle
        cx="233"
        cy="105"
        r="7"
        fill={`url(#${ids.peopleGradient})`}
        filter={`url(#${ids.softGlow})`}
      />

      <path
        d="M220 131C220 121 225 116 233 116C241 116 246 121 246 131"
        stroke={`url(#${ids.peopleGradient})`}
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Success path */}
      <path
        d="
          M27 190
          C64 198 82 182 94 159
          C108 132 122 116 146 103
          C165 93 183 82 197 67
          C207 56 218 51 232 50
        "
        stroke={`url(#${ids.pathGradient})`}
        strokeWidth="17"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${ids.glow})`}
      />

      {/* White road marking */}
      <path
        d="
          M27 190
          C64 198 82 182 94 159
          C108 132 122 116 146 103
          C165 93 183 82 197 67
          C207 56 218 51 232 50
        "
        stroke="#FFFFFF"
        strokeOpacity="0.9"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeDasharray="7 8"
      />

      {/* Arrow integrated into the C */}
      <path
        d="M232 50L216 45M232 50L224 64"
        stroke="#FFFFFF"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Path starting point */}
      <circle
        cx="27"
        cy="190"
        r="6"
        fill="#06B6D4"
        filter={`url(#${ids.softGlow})`}
      />

      <circle
        cx="27"
        cy="190"
        r="2"
        fill="#FFFFFF"
      />

      {/* Wordmark */}
      {showText && (
        <>
          <text
            x="345"
            y="96"
            fill={darkMode ? "#FFFFFFS" : "#0B1020"}
            fontFamily="Inter, Avenir Next, Helvetica, Arial, sans-serif"
            fontSize="56"
            fontWeight="800"
            letterSpacing="-2.4"
          >
            Saarthi Campus
          </text>

          {showTagline && (
            <>
              <path
                d="M348 130H590"
                stroke={`url(#${ids.textGradient})`}
                strokeWidth="3"
                strokeLinecap="round"
              />

              <text
                x="348"
                y="163"
                fill={darkMode ? "#CBD5E1" : "#475569"}
                fontFamily="Inter, Avenir Next, Helvetica, Arial, sans-serif"
                fontSize="22"
                fontWeight="600"
                letterSpacing="0.2"
              >
                Campus Recruitment Platform
              </text>

              <text
                x="348"
                y="188"
                fill={darkMode ? "#94A3B8" : "#64748B"}
                fontFamily="Inter, Avenir Next, Helvetica, Arial, sans-serif"
                fontSize="18"
                fontWeight="500"
                letterSpacing="0.5"
              >
                YOUR JOURNEY. OUR GUIDANCE. YOUR SUCCESS.
              </text>
            </>
          )}
        </>
      )}
    </svg>
  );
}