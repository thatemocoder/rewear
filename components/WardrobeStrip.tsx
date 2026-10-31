"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { addedCount, exportCatalogueJson, isStorageAvailable, localChangeCount, resetCatalogue } from "@/lib/catalogue";
import { ITEM_TYPES, type CatalogueItem } from "@/lib/schemas";
import { SwingTag } from "./SwingTag";

/** Items shown before "Show all", to keep the page short. */
const PREVIEW = 12;

/**
 * The viewer's wardrobe as a wrapping grid of swing tags (never scrolls sideways).
 * Items referenced by results come first, with an ink edge and a note.
 */
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

  const [showAll, setShowAll] = useState(false);

  const sorted = [...catalogue].sort(
    (a, b) =>
      Number(marks.has(b.item_id)) - Number(marks.has(a.item_id)) ||
      ITEM_TYPES.indexOf(a.type) - ITEM_TYPES.indexOf(b.type) ||
      a.item_id.localeCompare(b.item_id),
  );
  const visible = showAll ? sorted : sorted.slice(0, PREVIEW);
  const hidden = sorted.length - visible.length;

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
      <ul className="mt-4 grid grid-cols-2 gap-3 pt-1 sm:grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))]">
        {visible.map((item) => {
          const mark = marks.get(item.item_id);
          return (
            <li key={item.item_id} className="lift min-w-0">
              <SwingTag
                item={item}
                variant={mark ? "picked" : "default"}
                note={mark ? <span className="care mt-2 text-ink">{mark}</span> : undefined}
              />
            </li>
          );
        })}
      </ul>
      {(hidden > 0 || showAll) && (
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          {sorted.length > PREVIEW && (
            <button type="button" className="btn-secondary py-1.5 text-sm" onClick={() => setShowAll((v) => !v)} aria-expanded={showAll}>
              {showAll ? "Show fewer" : `Show all ${sorted.length} items`}
            </button>
          )}
          <Link href="/wardrobe" className="btn-quiet">
            Open Wardrobe
          </Link>
        </div>
      )}
    </section>
  );
}
