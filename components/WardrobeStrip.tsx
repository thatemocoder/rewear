"use client";

import { useEffect, useState } from "react";
import { addedCount, exportCatalogueJson, isStorageAvailable, localChangeCount, resetCatalogue } from "@/lib/catalogue";
import { ITEM_TYPES, type CatalogueItem } from "@/lib/schemas";
import { SwingTag } from "./SwingTag";

/** The viewer's wardrobe as a row of swing tags. Items referenced by results get an ink edge and a note. */
export function WardrobeStrip({
  catalogue,
  marks = new Map(),
}: {
  catalogue: CatalogueItem[];
  marks?: Map<string, string>; // item_id → short note, e.g. "In look 01"
}) {
  // Read client-only state after mount so server and client markup match.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const added = mounted ? addedCount() : 0;
  const changes = mounted ? localChangeCount() : 0;
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
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <button type="button" className="btn-quiet" onClick={exportCatalogueJson}>
            Export catalogue (JSON)
          </button>
          {changes > 0 && (
            <button
              type="button"
              className="btn-quiet"
              onClick={() => {
                if (
                  window.confirm(
                    `Undo your ${changes} change${changes === 1 ? "" : "s"} (added, edited or removed items) and remove kept photos, going back to the original catalogue? Export first if you want to keep your items.`,
                  )
                )
                  resetCatalogue();
              }}
            >
              Reset to my catalogue
            </button>
          )}
        </div>
      </div>
      {!storageOk && (
        <p className="mt-2 text-sm text-graphite">
          This browser isn&apos;t saving data, so items you add will disappear when you leave. Export to keep them.
        </p>
      )}
      <ul className="-mx-4 mt-4 flex gap-3 overflow-x-auto px-4 pt-1 pb-4 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
        {sorted.map((item) => {
          const mark = marks.get(item.item_id);
          return (
            <li key={item.item_id} className="lift w-40 shrink-0">
              <SwingTag
                item={item}
                variant={mark ? "picked" : "default"}
                note={mark ? <span className="care mt-2 text-ink">{mark}</span> : undefined}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
