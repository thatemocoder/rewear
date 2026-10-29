// Small thin-line icon set (24×24, stroke = currentColor). Decorative by default.
const PATHS = {
  hanger: "M12 7a2 2 0 1 1 2-2M12 7v1.5L3.5 15a1.5 1.5 0 0 0 .9 2.7h15.2a1.5 1.5 0 0 0 .9-2.7L12 8.5",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 11v5M12 8h.01",
  pencil: "M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4ZM13.5 6.5l4 4",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3",
  camera: "M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1ZM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z",
  upload: "M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3",
  arrow: "M5 12h14M13 6l6 6-6 6",
  pin: "M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12ZM12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  thermo: "M10 14.5V5a2 2 0 1 1 4 0v9.5a4 4 0 1 1-4 0ZM12 17v-6",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 1.5v2M12 20.5v2M3.5 12h-2M22.5 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4",
  partSun: "M8 4.5v1.5M3.5 9H2M4.8 5.8l-1-1M12 8.6A4 4 0 0 0 4.4 11M7 19h10a4 4 0 1 0-1-7.9A5 5 0 0 0 7 13a3 3 0 0 0 0 6Z",
  cloud: "M7 19h10a4 4 0 1 0-1-7.9A5 5 0 0 0 6 12a3.5 3.5 0 0 0 1 7Z",
  rain: "M7 15h10a4 4 0 1 0-1-7.9A5 5 0 0 0 6 8a3.5 3.5 0 0 0 1 7ZM8 18l-1 3M12 18l-1 3M16 18l-1 3",
  storm: "M7 15h10a4 4 0 1 0-1-7.9A5 5 0 0 0 6 8a3.5 3.5 0 0 0 1 7ZM12 15l-2 4h4l-2 4",
  snow: "M7 14h10a4 4 0 1 0-1-7.9A5 5 0 0 0 6 7a3.5 3.5 0 0 0 1 7ZM8 18h.01M12 20h.01M16 18h.01M10 22h.01M14 22h.01",
  fog: "M4 9h16M3 13h18M5 17h14M7 21h10",
  shield: "M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6l-7-3Z",
  refresh: "M20 11a8 8 0 0 0-14.6-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.6 4.5L20 16M20 20v-4h-4",
  shirt: "M9 3 4 6l2 4 2-1v12h8V9l2 1 2-4-5-3a3 3 0 0 1-6 0Z",
  chevron: "M6 9l6 6 6-6",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2",
  chat: "M4 5h16v11H9l-5 4V5Z",
  check: "M5 12.5 10 17 19 7",
  x: "M6 6l12 12M18 6 6 18",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "size-4", label }: { name: IconName; className?: string; label?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

/** Pick a weather icon from Open-Meteo-style condition words. */
export function weatherIcon(conditions: string): IconName {
  const c = conditions.toLowerCase();
  if (/thunder|storm/.test(c)) return "storm";
  if (/snow/.test(c)) return "snow";
  if (/rain|drizzle|shower/.test(c)) return "rain";
  if (/fog/.test(c)) return "fog";
  if (/overcast/.test(c)) return "cloud";
  if (/partly|mainly/.test(c)) return "partSun";
  return "sun";
}
