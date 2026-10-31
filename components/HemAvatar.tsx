import { useId } from "react";

/**
 * Hem's face: an original illustration (unbothered, lashes down, pout, black gloves).
 * Drawn as SVG so it scales cleanly and isn't a copy of any emoji set.
 */
export function HemAvatar({ size = 48, className = "", decorative = false }: { size?: number; className?: string; decorative?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const g = `hemface${uid}`;
  const s = `hemshade${uid}`;
  return (
    <svg
      viewBox="0 0 150 104"
      width={size * 1.44}
      height={size}
      className={`shrink-0 ${className}`}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : "Hem, Rewear’s AI stylist"}
      aria-hidden={decorative ? true : undefined}
    >
      <defs>
        <radialGradient id={g} cx="42%" cy="32%" r="72%">
          <stop offset="0%" stopColor="#FFE07A" />
          <stop offset="55%" stopColor="#FDBF3B" />
          <stop offset="100%" stopColor="#E8901A" />
        </radialGradient>
        <radialGradient id={s} cx="50%" cy="85%" r="60%">
          <stop offset="0%" stopColor="#C46A0C" stopOpacity=".28" />
          <stop offset="100%" stopColor="#C46A0C" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* face */}
      <circle cx="75" cy="54" r="44" fill={`url(#${g})`} />
      <circle cx="75" cy="54" r="44" fill={`url(#${s})`} />
      <ellipse cx="61" cy="26" rx="16" ry="7" fill="#FFF3C2" opacity=".55" />

      {/* raised brows */}
      <path d="M48 38 Q57 25 68 31" fill="none" stroke="#6B3F12" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M82 31 Q93 25 102 38" fill="none" stroke="#6B3F12" strokeWidth="3.4" strokeLinecap="round" />

      {/* closed eyes with long lashes */}
      <g stroke="#3A2410" strokeLinecap="round" fill="none" transform="translate(9 0)">
        <path d="M38 52 Q48 59 59 52" strokeWidth="3" />
        <path d="M73 52 Q84 59 94 52" strokeWidth="3" />
        {[0, 1, 2, 3, 4].map((i) => {
          const x = 40 + i * 4.4;
          const y = 53.5 + Math.sin((i / 4) * Math.PI) * 3.2;
          return <path key={`l${i}`} d={`M${x} ${y} l${-1.5 + i * 0.4} 5.5`} strokeWidth="1.8" />;
        })}
        {[0, 1, 2, 3, 4].map((i) => {
          const x = 75 + i * 4.4;
          const y = 53.5 + Math.sin((i / 4) * Math.PI) * 3.2;
          return <path key={`r${i}`} d={`M${x} ${y} l${-0.1 + i * 0.4} 5.5`} strokeWidth="1.8" />;
        })}
      </g>

      {/* pout */}
      <path
        transform="translate(9 0)"
        d="M56 74 Q60 68 66 71 Q72 68 76 74 Q72 77 66 76 Q60 77 56 74 Z"
        fill="#F2A23A"
        stroke="#A5600F"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path transform="translate(9 0)" d="M57 75 Q66 86 75 75 Q66 80 57 75 Z" fill="#EE9A2F" stroke="#A5600F" strokeWidth="1.6" strokeLinejoin="round" />

      {/* gloved hands, long nails up */}
      {[
        { x: 2, flip: 1 },
        { x: 148, flip: -1 },
      ].map(({ x, flip }) => (
        <g key={x} transform={`translate(${x} 0) scale(${flip} 1)`}>
          <path d="M6 96 L10 70 Q11 62 19 61 L27 61 Q33 62 33 69 L31 96 Z" fill="#141210" />
          <rect x="11" y="46" width="5.5" height="18" rx="2.6" fill="#FDBF3B" stroke="#C47A12" strokeWidth=".8" />
          <rect x="17" y="43" width="5.5" height="21" rx="2.6" fill="#FDBF3B" stroke="#C47A12" strokeWidth=".8" />
          <rect x="23" y="45" width="5.5" height="19" rx="2.6" fill="#FDBF3B" stroke="#C47A12" strokeWidth=".8" />
          <path d="M11.4 47 L13.7 37 L16 47 Z M17.4 44 L19.7 33 L22 44 Z M23.4 46 L25.7 36 L28 46 Z" fill="#141210" />
          <path d="M8 74 Q16 70 32 74" stroke="#2C2824" strokeWidth="1.2" fill="none" />
        </g>
      ))}
    </svg>
  );
}
