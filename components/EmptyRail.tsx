import { GarmentArt } from "./GarmentArt";

const HANGING = [
  { type: "top" as const, notes: "knit", colour: "oat", tilt: -3 },
  { type: "dress" as const, notes: "dress", colour: "sage", tilt: 2 },
  { type: "outerwear" as const, notes: "coat", colour: "camel", tilt: -1.5 },
];

/** Empty state for results: a clothes rail with three garments, waiting. */
export function EmptyRail({ caption = "Your looks land here." }: { caption?: string }) {
  return (
    <figure className="mx-auto max-w-md pt-2 select-none" aria-label={caption}>
      <div className="relative px-6">
        {/* rail */}
        <div className="h-[3px] rounded-full bg-ink/80" />
        <div className="absolute top-0 left-4 h-24 w-[3px] rounded-full bg-ink/80" />
        <div className="absolute top-0 right-4 h-24 w-[3px] rounded-full bg-ink/80" />
        <ul className="grid grid-cols-3 gap-4 px-6" aria-hidden>
          {HANGING.map((g, i) => (
            <li key={i} className="flex origin-top flex-col items-center" style={{ rotate: `${g.tilt}deg` }}>
              {/* hanger */}
              <svg viewBox="0 0 60 26" className="w-14 text-ink" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M30 0v5a3 3 0 1 1 3 3M30 10 6 22a2 2 0 0 0 1 3.5h46a2 2 0 0 0 1-3.5L30 10" />
              </svg>
              <GarmentArt item={g} className="-mt-3 w-full opacity-85" />
            </li>
          ))}
        </ul>
      </div>
      <figcaption className="mt-4 text-center font-serif text-lg text-graphite italic">{caption}</figcaption>
    </figure>
  );
}
