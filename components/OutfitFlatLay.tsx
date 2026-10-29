import type { CatalogueItem, Outfit } from "@/lib/schemas";
import { AiLabel } from "./AiLabel";
import { usePhotos } from "@/lib/photos";
import { GarmentCard } from "./GarmentCard";

// Small alternating tilts make the grid read as a flat-lay rather than a table.
const TILTS = [-1.2, 0.8, -0.5, 1.1, -0.9, 0.6];

export function OutfitFlatLay({
  outfit,
  index,
  catalogue,
  label,
  idPrefix = "look",
}: {
  outfit: Outfit;
  index: number;
  catalogue: Map<string, CatalogueItem>;
  label?: string;
  idPrefix?: string;
}) {
  const hid = `${idPrefix}-${index}`;
  const photos = usePhotos();
  return (
    <article className="rise" style={{ animationDelay: `${index * 60}ms` }} aria-labelledby={hid}>
      <header className="flex items-baseline justify-between border-t border-ink pt-2">
        <AiLabel />
        <h3 id={hid} className="care text-graphite">
          {label ?? `Look ${String(index + 1).padStart(2, "0")}`}
        </h3>
      </header>
      <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
        {outfit.items.map((ref, i) => (
          <li key={`${ref.item_id}-${i}`}>
            <GarmentCard
              item={catalogue.get(ref.item_id)}
              fallback={ref}
              photoUrl={photos.get(ref.item_id)}
              tilt={TILTS[i % TILTS.length]}
            />
          </li>
        ))}
      </ul>
      {outfit.reason && <p className="mt-5 max-w-prose font-serif text-xl leading-snug italic">{outfit.reason}</p>}
    </article>
  );
}
