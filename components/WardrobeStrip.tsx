"use client";

import { useEffect, useState } from "react";
import { addedCount, isStorageAvailable, resetCatalogue } from "@/lib/catalogue";
import { ITEM_TYPES, type CatalogueItem } from "@/lib/schemas";
import { SwingTag } from "./SwingTag";

/** The viewer's wardrobe as a row of swing tags. Items used in results get an ink edge. */
export function WardrobeStrip({
  catalogue,
  picked = new Map(),
}: {
  catalogue: CatalogueItem[];
  picked?: Map<string, number[]>; // item_id → look numbers it appears in
}) {
  // Read client-only state after mount so server and client markup match.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const added = mounted ? addedCount() : 0;
  const storageOk = !mounted || isStorageAvailable();

  const sorted = [...catalogue].sort(
    (a, b) => ITEM_TYPES.indexOf(a.type) - ITEM_TYPES.indexOf(b.type) || a.item_id.localeCompare(b.item_id),
  );

  return (
    <section aria-labelledby="wardrobe-h" className="border-t border-ink pt-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <div className="flex items-baseline gap-4">
          <h2 id="wardrobe-h" className="font-serif text-xl">
            Your wardrobe
          </h2>
          <span className="care text-graphite">
            {catalogue.length} items{added ? ` · ${added} added by you` : ""}
          </span>
        </div>
        {added > 0 && (
          <button
            type="button"
            className="btn-quiet text-sm"
            onClick={() => {
              if (window.confirm(`Remove the ${added} item${added === 1 ? "" : "s"} you added and go back to the original catalogue?`))
                resetCatalogue();
            }}
          >
            Reset to my catalogue
          </button>
        )}
      </div>
      {!storageOk && (
        <p className="mt-2 text-sm text-graphite">
          This browser isn&apos;t saving data, so items you add will disappear when you leave.
        </p>
      )}
      <ul className="-mx-4 mt-4 flex gap-3 overflow-x-auto px-4 pt-1 pb-4 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
        {sorted.map((item) => {
          const looks = picked.get(item.item_id);
          return (
            <li key={item.item_id} className="w-36 shrink-0">
              <SwingTag
                item={item}
                variant={looks ? "picked" : "default"}
                note={
                  looks ? (
                    <span className="care mt-2 text-ink">In look {looks.map((n) => String(n).padStart(2, "0")).join(", ")}</span>
                  ) : undefined
                }
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
