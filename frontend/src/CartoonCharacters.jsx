import React from 'react';

/**
 * 1. TechFairyCharacter ("Fairy Anna" — Fae_cute_sticker.PNG)
 * Uses Anna's official Fae_cute_sticker with animated fairy wings, floating sparkles,
 * magic wand, and flying DM envelopes in Fae's signature bubblegum pink (#FF7EB6) & lilac (#B799E8).
 */
export function TechFairyCharacter({ isCasting = false }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center select-none">
      {/* Ambient SVG Halo, Animated Wings, Wand & Flying DM Envelope */}
      <svg
        viewBox="0 0 260 230"
        className="w-full h-full overflow-visible"
        aria-label="Animated Fae Cute Sticker dispatching Instagram DMs"
      >
        {/* Soft Lilac & Pink Backdrop Circle */}
        <circle cx="130" cy="120" r="82" fill="#F5EEFF" stroke="#19154E" strokeWidth="2.5" />
        <circle cx="48" cy="54" r="10" fill="#FF7EB6" stroke="#19154E" strokeWidth="2" />
        <circle cx="214" cy="172" r="8" fill="#B799E8" stroke="#19154E" strokeWidth="2" />

        {/* Floating Sparkles */}
        <g className="anim-star" style={{ transformOrigin: '44px 142px' }}>
          <path
            d="M44 130 L47 139 L56 142 L47 145 L44 154 L41 145 L32 142 L41 139 Z"
            fill="#FF7EB6"
            stroke="#19154E"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </g>
        <g className="anim-star" style={{ transformOrigin: '215px 52px', animationDelay: '0.8s' }}>
          <path
            d="M215 40 L218 49 L227 52 L218 55 L215 64 L212 55 L203 52 L212 49 Z"
            fill="#B799E8"
            stroke="#19154E"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </g>

        {/* Animated Fairy Wings Behind Fae */}
        <g className="anim-char-float">
          <path
            d="M85 118 C25 70, 14 132, 72 152 C38 164, 50 194, 92 170 Z"
            fill="#FFE4F1"
            stroke="#19154E"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M175 118 C235 70, 246 132, 188 152 C222 164, 210 194, 168 170 Z"
            fill="#FFE4F1"
            stroke="#19154E"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Animated Magic Wand on Right */}
          <g
            className={isCasting ? 'anim-char-wand-active' : 'anim-char-arm'}
            style={{ transformOrigin: '175px 165px' }}
          >
            <line
              x1="175"
              y1="165"
              x2="218"
              y2="82"
              stroke="#19154E"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            <path
              d="M220 66 L224 76 L234 79 L224 83 L220 93 L216 83 L206 79 L216 76 Z"
              fill="#FF7EB6"
              stroke="#19154E"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
          </g>

          {/* Flying DM Envelope in Fae Pink & Lilac */}
          <g className="anim-char-plane" transform="translate(184, 30)">
            <rect
              x="0"
              y="0"
              width="38"
              height="25"
              rx="6"
              fill="#FFFFFF"
              stroke="#19154E"
              strokeWidth="2.5"
            />
            <path
              d="M2 3 L19 15 L36 3"
              fill="none"
              stroke="#19154E"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="33" cy="2" r="5.5" fill="#FF7EB6" stroke="#19154E" strokeWidth="1.8" />
          </g>
        </g>
      </svg>

      {/* Official Fae Cute Sticker Image Centered & Bobbing */}
      <img
        src="./fae_cute_sticker.png"
        alt="Fae Cute Sticker"
        className={`absolute w-40 h-40 sm:w-44 sm:h-44 object-contain pointer-events-none drop-shadow-[0_6px_12px_rgba(25,21,78,0.16)] ${
          isCasting ? 'anim-char-wand-active' : 'anim-char-float'
        }`}
      />
    </div>
  );
}

/**
 * 2. DataAstronomerCharacter ("Don't Look Up" Inspired Cartoon Analyst in Fae Pink & Lilac)
 */
export function DataAstronomerCharacter() {
  return (
    <svg
      viewBox="0 0 280 210"
      className="w-full h-full select-none overflow-visible"
      aria-label="Cartoon astronomer peering through a telescope at Instagram metrics"
    >
      {/* Soft Lilac backdrop */}
      <circle cx="140" cy="112" r="76" fill="#F5EEFF" stroke="#19154E" strokeWidth="2.5" />

      {/* Floating Metric Planet & Stars */}
      <g className="anim-star" style={{ transformOrigin: '225px 48px' }}>
        <circle cx="225" cy="48" r="16" fill="#FF7EB6" stroke="#19154E" strokeWidth="2.5" />
        <ellipse
          cx="225"
          cy="48"
          rx="26"
          ry="6"
          fill="none"
          stroke="#19154E"
          strokeWidth="2.2"
          transform="rotate(-22 225 48)"
        />
        <text x="225" y="52" textAnchor="middle" fontSize="9" fontWeight="800" fill="#19154E">
          4.2x
        </text>
      </g>

      <g className="anim-char-float">
        {/* Character Body / Lilac Sweater like Fae */}
        <path
          d="M54 190 C54 140, 128 140, 128 190 Z"
          fill="#B799E8"
          stroke="#19154E"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="M78 148 L91 188 L104 148 Z"
          fill="#FF7EB6"
          stroke="#19154E"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Character Head Tilted Up ("Looking Up!") with Fae Pink Hair */}
        <g className="anim-char-head" style={{ transformOrigin: '90px 135px' }}>
          <circle cx="68" cy="82" r="14" fill="#FF7EB6" stroke="#19154E" strokeWidth="2.5" />
          <circle cx="88" cy="72" r="15" fill="#FF7EB6" stroke="#19154E" strokeWidth="2.5" />
          <circle cx="108" cy="80" r="12" fill="#FF7EB6" stroke="#19154E" strokeWidth="2.5" />

          {/* Head */}
          <rect
            x="62"
            y="80"
            width="58"
            height="56"
            rx="28"
            fill="#FAD0BD"
            stroke="#19154E"
            strokeWidth="3"
          />

          {/* Wide Amazed Eyes Looking Up-Right */}
          <g className="anim-char-eyes" style={{ transformOrigin: '95px 104px' }}>
            <circle cx="84" cy="104" r="9" fill="#FFFFFF" stroke="#19154E" strokeWidth="2.5" />
            <circle cx="106" cy="104" r="11" fill="#FFFFFF" stroke="#19154E" strokeWidth="2.5" />
            <circle cx="87" cy="101" r="4" fill="#19154E" />
            <circle cx="109" cy="101" r="4.5" fill="#19154E" />
          </g>

          {/* Excited Smile */}
          <ellipse
            cx="97"
            cy="122"
            rx="5.5"
            ry="6"
            fill="#FF7EB6"
            stroke="#19154E"
            strokeWidth="2.5"
          />
        </g>

        {/* Giant Animated Pink & Lilac Telescope on Tripod */}
        <g>
          <line x1="162" y1="138" x2="142" y2="190" stroke="#19154E" strokeWidth="4" strokeLinecap="round" />
          <line x1="162" y1="138" x2="164" y2="192" stroke="#19154E" strokeWidth="4" strokeLinecap="round" />
          <line x1="162" y1="138" x2="186" y2="190" stroke="#19154E" strokeWidth="4" strokeLinecap="round" />

          <g className="anim-char-telescope" style={{ transformOrigin: '162px 134px' }}>
            <path
              d="M118 118 L202 72 L214 96 L126 134 Z"
              fill="#FF7EB6"
              stroke="#19154E"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <line x1="176" y1="86" x2="186" y2="108" stroke="#19154E" strokeWidth="3" />
            <ellipse
              cx="208"
              cy="84"
              rx="8"
              ry="14"
              transform="rotate(-26 208 84)"
              fill="#B799E8"
              stroke="#19154E"
              strokeWidth="3"
            />
          </g>
        </g>
      </g>
    </svg>
  );
}

/**
 * 3. PlugMechanicCharacter (Connect IG Tab Character in Fae Pink & Lilac)
 */
export function PlugMechanicCharacter({ connected = false }) {
  return (
    <svg
      viewBox="0 0 240 160"
      className="w-full h-full select-none overflow-visible"
      aria-label="Cartoon character connecting Instagram plug"
    >
      <g className="anim-char-float">
        {/* Left Cord & Plug (Instagram — Fae Bubblegum Pink) */}
        <path
          d="M10 110 C40 110, 55 85, 84 85"
          fill="none"
          stroke="#19154E"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <rect
          x="76"
          y="68"
          width="34"
          height="34"
          rx="10"
          fill="#FF7EB6"
          stroke="#19154E"
          strokeWidth="2.8"
        />
        <line x1="110" y1="78" x2="122" y2="78" stroke="#19154E" strokeWidth="4" strokeLinecap="round" />
        <line x1="110" y1="92" x2="122" y2="92" stroke="#19154E" strokeWidth="4" strokeLinecap="round" />

        {/* Right Socket & Cord (SocialAssist — Fae Lilac) */}
        <path
          d="M230 110 C200 110, 185 85, 156 85"
          fill="none"
          stroke="#19154E"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <rect
          x="130"
          y="68"
          width="34"
          height="34"
          rx="10"
          fill={connected ? '#C8F904' : '#B799E8'}
          stroke="#19154E"
          strokeWidth="2.8"
        />

        {/* Spark in Center */}
        <g className="anim-star" style={{ transformOrigin: '120px 44px' }}>
          <path
            d="M124 24 L112 44 L122 44 L116 60 L132 38 L121 38 Z"
            fill="#FF7EB6"
            stroke="#19154E"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </g>
      </g>
    </svg>
  );
}
