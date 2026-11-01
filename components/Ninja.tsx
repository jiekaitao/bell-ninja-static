/* The Bell Ninja. Stands guard, says nothing, knows when the bell rings. */
export default function Ninja({ size = 160, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 200 236" width={size} height={size * 1.18} className={['ninja', className].filter(Boolean).join(' ')} role="img" aria-label="Bell Ninja">
      {/* Katana, slung across the back: handle over the shoulder, blade past the hip. */}
      <path d="M46 96l142 118" stroke="#b9c6cc" strokeWidth="8" strokeLinecap="round" />
      <path d="M36 88l24 21" stroke="#e8c76a" strokeWidth="5" strokeLinecap="round" transform="translate(9 -6)" />
      <path d="M12 54l34 29" stroke="#2a2a2e" strokeWidth="12" strokeLinecap="round" />
      <path d="M18 50l-3 11M27 58l-3 11M36 66l-3 11" stroke="#e8c76a" strokeWidth="3" strokeLinecap="round" />
      <path d="M149 62c14-6 25-4 36-12-2 12-10 20-22 22 10 2 18 8 22 18-13-7-24-9-36-12Z" fill="#d4363b" />
      <path d="M66 138c-16 10-26 26-30 44" stroke="#232327" strokeWidth="24" strokeLinecap="round" fill="none" />
      <path d="M134 138c16 10 26 26 30 44" stroke="#232327" strokeWidth="24" strokeLinecap="round" fill="none" />
      <path d="M64 128h72c6 24 8 48 7 72H57c-1-24 1-48 7-72Z" fill="#232327" />
      <rect x="58" y="172" width="84" height="9" fill="#3b3b40" />
      <rect x="62" y="194" width="34" height="38" rx="14" fill="#232327" />
      <rect x="104" y="194" width="34" height="38" rx="14" fill="#232327" />
      <circle cx="100" cy="74" r="62" fill="#232327" />
      <rect x="53" y="55" width="94" height="42" rx="21" fill="#f8d2a7" />
      <path d="M62 62l32 13" stroke="#232327" strokeWidth="7" strokeLinecap="round" />
      <path d="M138 62l-32 13" stroke="#232327" strokeWidth="7" strokeLinecap="round" />
      <ellipse cx="80" cy="79" rx="7" ry="8.500" fill="#141416" />
      <ellipse cx="120" cy="79" rx="7" ry="8.500" fill="#141416" />
      <circle cx="82.500" cy="76" r="2.200" fill="#fff" />
      <circle cx="122.500" cy="76" r="2.200" fill="#fff" />
    </svg>
  );
}
