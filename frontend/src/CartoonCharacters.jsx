import React, { useState, useEffect } from 'react';

/**
 * 1. TechFairyCharacter ("Fairy Anna" — Animated Cartoon Fae Sticker)
 * Pure animated Fae character (zero background clutter behind the sticker!):
 * - Natural periodic blinking using hand-matched 4x supersampled frames (fae_cute_sticker.png -> fae_cute_blink.png)
 * - Happy talking/laughing expression (fae_cute_talk.png) when clicked or when sending a DM
 * - Independent head-tilt, squash-and-stretch bounce, and floating speech bubble
 */
export function TechFairyCharacter({ isCasting = false }) {
  const [frame, setFrame] = useState('open'); // 'open' | 'blink' | 'talk'
  const [isBouncing, setIsBouncing] = useState(false);

  // Natural periodic eye blinking loop
  useEffect(() => {
    if (isCasting) {
      setFrame('talk');
      setIsBouncing(true);
      const t = setTimeout(() => {
        setFrame('open');
        setIsBouncing(false);
      }, 900);
      return () => clearTimeout(t);
    }

    let blinkTimeout;
    const interval = setInterval(() => {
      setFrame('blink');
      blinkTimeout = setTimeout(() => {
        setFrame('open');
      }, 170);
    }, 3400);

    return () => {
      clearInterval(interval);
      clearTimeout(blinkTimeout);
    };
  }, [isCasting]);

  const handleManualPoke = () => {
    setIsBouncing(true);
    setFrame('talk');
    setTimeout(() => {
      setFrame('blink');
      setTimeout(() => {
        setFrame('open');
        setIsBouncing(false);
      }, 140);
    }, 650);
  };

  const currentSrc =
    frame === 'blink'
      ? './fae_cute_blink.png'
      : frame === 'talk'
      ? './fae_cute_talk.png'
      : './fae_cute_sticker.png';

  return (
    <div
      onClick={handleManualPoke}
      className="relative w-full h-full flex items-center justify-center select-none cursor-pointer group"
      aria-label="Animated Fae cartoon character"
    >
      {/* Cute Speech Bubble when talking / sending DM */}
      {(frame === 'talk' || isCasting) && (
        <div className="absolute -top-3 right-0 z-20 px-3 py-1 rounded-2xl bg-[#FF7EB6] text-[#19154E] border-2 border-[#19154E] shadow-[3px_3px_0px_#19154E] text-xs font-display font-bold panel-enter">
          Sent DM! 💌✨
        </div>
      )}

      {/* Preload frames so transitions are instant with zero flicker */}
      <div className="hidden" aria-hidden="true">
        <img src="./fae_cute_sticker.png" alt="" />
        <img src="./fae_cute_blink.png" alt="" />
        <img src="./fae_cute_talk.png" alt="" />
      </div>

      {/* Animated Cartoon Fae Character (Head tilt + bounce + blinking/talking frames) */}
      <div
        className={`relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center ${
          isBouncing ? 'anim-char-wand-active' : 'anim-char-head'
        }`}
        style={{ transformOrigin: '50% 82%' }}
      >
        <img
          src={currentSrc}
          alt="Animated Fae Character"
          className="w-full h-full object-contain drop-shadow-[0_8px_16px_rgba(25,21,78,0.14)] transition-transform duration-150"
        />
      </div>
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
      <circle cx="140" cy="112" r="76" fill="#F5EEFF" stroke="#19154E" strokeWidth="2.5" />

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

        <g className="anim-char-head" style={{ transformOrigin: '90px 135px' }}>
          <circle cx="68" cy="82" r="14" fill="#FF7EB6" stroke="#19154E" strokeWidth="2.5" />
          <circle cx="88" cy="72" r="15" fill="#FF7EB6" stroke="#19154E" strokeWidth="2.5" />
          <circle cx="108" cy="80" r="12" fill="#FF7EB6" stroke="#19154E" strokeWidth="2.5" />

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

          <g className="anim-char-eyes" style={{ transformOrigin: '95px 104px' }}>
            <circle cx="84" cy="104" r="9" fill="#FFFFFF" stroke="#19154E" strokeWidth="2.5" />
            <circle cx="106" cy="104" r="11" fill="#FFFFFF" stroke="#19154E" strokeWidth="2.5" />
            <circle cx="87" cy="101" r="4" fill="#19154E" />
            <circle cx="109" cy="101" r="4.5" fill="#19154E" />
          </g>

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
