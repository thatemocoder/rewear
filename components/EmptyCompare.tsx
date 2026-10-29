import { GarmentArt } from "./GarmentArt";

/** Empty state for Before you buy: something you own beside something you're considering. */
export function EmptyCompare() {
  return (
    <figure className="mx-auto max-w-sm pt-2 select-none" aria-label="The overlap shows here. The decision stays yours.">
      <div className="flex items-end justify-center gap-6" aria-hidden>
        <div className="w-32 -rotate-3 rounded-lg border border-hairline bg-card p-3">
          <GarmentArt item={{ type: "outerwear", notes: "jacket", colour: "charcoal" }} className="w-full" />
          <p className="mt-1 text-center text-xs text-graphite">You own</p>
        </div>
        <span className="mb-16 font-serif text-2xl text-graphite italic">vs</span>
        <div className="w-32 rotate-2 rounded-lg border-[1.5px] border-dashed border-graphite/60 bg-paper p-3">
          <GarmentArt item={{ type: "outerwear", notes: "blazer", colour: "black" }} className="w-full opacity-40" />
          <p className="mt-1 text-center text-xs text-graphite">Considering</p>
        </div>
      </div>
      <figcaption className="mt-5 text-center font-serif text-lg text-graphite italic">
        The overlap shows here. The decision stays yours.
      </figcaption>
    </figure>
  );
}
