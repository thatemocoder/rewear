import type { ReactNode } from "react";
import type { CatalogueItem, ItemRef } from "@/lib/schemas";
import { GarmentArt } from "./GarmentArt";

const sentence = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/**
 * An item shown as the garment itself: the kept photo if there is one (on this device
 * only), otherwise a colour silhouette. A small swing tag carries the ID. An ID the AI
 * referenced that isn't in the catalogue gets a hatched "not in your wardrobe" card.
 */
export function GarmentCard({
  item,
  fallback,
  photoUrl,
  picked = false,
  tilt = 0,
  note,
  corner,
}: {
  item?: CatalogueItem;
  fallback?: ItemRef;
  photoUrl?: string;
  picked?: boolean;
  tilt?: number;
  note?: ReactNode;
  corner?: ReactNode; // small overlay in the image's top-right corner (e.g. a badge)
}) {
  const id = item?.item_id ?? fallback?.item_id ?? "—";
  return (
    <figure className="h-full" style={tilt ? { rotate: `${tilt}deg` } : undefined}>
      <div
        className={`relative aspect-[4/5] overflow-hidden rounded-lg border bg-card ${picked ? "border-ink border-[1.5px]" : "border-hairline"} ${
          item ? "" : "bg-[repeating-linear-gradient(-45deg,var(--color-card)_0_6px,var(--color-paper)_6px_7px)]"
        }`}
      >
        {item ? (
          photoUrl ? (
            <img src={photoUrl} alt={`Photo of ${item.colour} ${item.notes}`} className="absolute inset-0 size-full object-contain p-2" />
          ) : (
            <GarmentArt item={item} className="absolute inset-0 m-auto h-[82%] w-[82%]" />
          )
        ) : (
          <span className="care absolute inset-x-3 bottom-3 text-graphite">Not in your wardrobe</span>
        )}
        {corner && <span className="absolute top-2 right-2">{corner}</span>}
        {/* Mini swing tag pinned to the corner */}
        <span className="swing absolute top-2 left-2 h-auto" style={{ ["--cut" as string]: "6px" }}>
          <span className="swing-body flex items-center gap-1.5 px-2 pt-1.5 pb-1">
            <span aria-hidden className="size-1.5 rounded-full border border-hairline bg-paper" />
            <span className="font-mono text-[11px] font-medium tracking-wide">{id}</span>
          </span>
        </span>
      </div>
      <figcaption className="mt-2">
        <span className="block text-sm leading-snug font-medium">
          {item ? sentence(item.notes) || "Untitled item" : sentence(fallback?.description ?? "") || "Unknown item"}
        </span>
        {item && <span className="block text-sm leading-snug text-graphite">{item.colour}</span>}
        {note}
      </figcaption>
    </figure>
  );
}
