'use client';

/* The ninja who guards the schedule. It lives on the right edge of the page,
   perks up when you hover, and when you click it drops the sign and presents
   the schedule with a big "ta-da". */

/** A four-pointed sparkle centered on x, y. */
const sparkle = (x: number, y: number, r: number) =>
  `M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`;

function NinjaWithSign() {
  return (
    <svg viewBox="0 0 180 176" className="ninja ninja-art" aria-hidden="true">
      <g className="ninja-figure">
        <path d="M60 118c0-16 13-26 30-26s30 10 30 26l3 30a10 10 0 0 1-10 11H67a10 10 0 0 1-10-11Z" fill="#232327" />
        <path d="M59 139h62l.7 8H58.3Z" fill="#3b3b40" />
        <rect x="62" y="146" width="26" height="28" rx="11" fill="#232327" />
        <rect x="92" y="146" width="26" height="28" rx="11" fill="#232327" />

        <g className="ninja-head">
          <path d="M46 52C32 46 21 48 10 40c2 12 10 20 22 22-10 2-18 8-22 18 13-7 24-9 36-12Z" fill="#8f1f24" />
          <circle cx="90" cy="56" r="48" fill="#232327" />
          <rect x="52" y="40" width="76" height="32" rx="16" fill="#f8d2a7" />

          <g className="ninja-face-calm">
            <path d="M60 44l24 10M120 44l-24 10" stroke="#232327" strokeWidth="6" strokeLinecap="round" />
            <g className="ninja-eyes">
              <ellipse cx="75" cy="59" rx="5.5" ry="6.5" fill="#141416" />
              <ellipse cx="105" cy="59" rx="5.5" ry="6.5" fill="#141416" />
              <circle cx="77" cy="57" r="1.8" fill="#fff" />
              <circle cx="107" cy="57" r="1.8" fill="#fff" />
            </g>
          </g>
          <g className="ninja-face-happy">
            <path d="M67 60c3-8 12-8 15 0M98 60c3-8 12-8 15 0" stroke="#141416" strokeWidth="5" strokeLinecap="round" fill="none" />
            <circle cx="62" cy="65" r="4" fill="#f0a08a" />
            <circle cx="118" cy="65" r="4" fill="#f0a08a" />
          </g>
        </g>

        {/* Ta-da: stubby arms flung out from each shoulder, in the body's color
            so they read as part of it. */}
        <g className="ninja-arm ninja-arm-left">
          <path d="M67 114Q50 112 39 98" stroke="#232327" strokeWidth="14" strokeLinecap="round" fill="none" />
          <circle cx="35" cy="93" r="9.5" fill="#232327" />
        </g>
        <g className="ninja-arm ninja-arm-right">
          <path d="M113 114Q130 112 141 98" stroke="#232327" strokeWidth="14" strokeLinecap="round" fill="none" />
          <circle cx="145" cy="93" r="9.5" fill="#232327" />
        </g>

        <g className="ninja-sign">
          <rect x="8" y="98" width="164" height="48" rx="7" fill="#fff8ee" stroke="#232327" strokeWidth="4" />
          <text x="15" y="130" fontSize="21.5" fontWeight="900" letterSpacing="0.8" fill="#d4363b">SCHEDULE</text>
          <path className="ninja-arrow" d="M138 122h21m-8-8 8 8-8 8" stroke="#d4363b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="26" cy="99" r="11" fill="#232327" />
          <circle cx="154" cy="99" r="11" fill="#232327" />
        </g>

        <path className="ninja-sparkle" d={sparkle(164, 72, 9)} fill="#ffe08a" />
        <path className="ninja-sparkle" d={sparkle(168, 106, 6)} fill="#ffe08a" />
        <path className="ninja-sparkle" d={sparkle(16, 112, 6)} fill="#ffe08a" />
      </g>
    </svg>
  );
}

interface NinjaTabProps {
  open: boolean;
  onToggle: () => void;
}

export default function NinjaTab({ open, onToggle }: NinjaTabProps) {
  return (
    <button
      type="button"
      id="schedule-toggle"
      className={'ninja-tab' + (open ? ' ninja-tab-open' : '')}
      onClick={onToggle}
      aria-expanded={open}
      aria-controls="todays-bells"
      aria-label={open ? "Hide today's schedule" : "Show today's schedule"}
    >
      <NinjaWithSign />
    </button>
  );
}
