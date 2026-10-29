"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ItemEditDialog } from "@/components/ItemEditDialog";
import { GarmentCard } from "@/components/GarmentCard";
import {
  exportCatalogueJson,
  isAddedHere,
  isEditedHere,
  localChangeCount,
  removeItem,
  resetCatalogue,
  useCatalogue,
} from "@/lib/catalogue";
import { prepareImage } from "@/lib/image";
import { deletePhoto, savePhoto, usePhotos } from "@/lib/photos";
import { ITEM_TYPES, type CatalogueItem, type ItemType } from "@/lib/schemas";

const LEVELS = {
  formality: [
    { label: "Any formality", min: 1, max: 5 },
    { label: "Casual (1–2)", min: 1, max: 2 },
    { label: "Smart (3)", min: 3, max: 3 },
    { label: "Formal (4–5)", min: 4, max: 5 },
  ],
  warmth: [
    { label: "Any warmth", min: 1, max: 5 },
    { label: "Light (1–2)", min: 1, max: 2 },
    { label: "Mid (3)", min: 3, max: 3 },
    { label: "Warm (4–5)", min: 4, max: 5 },
  ],
};

const SORTS = {
  type: "Type",
  formal: "Most formal",
  warm: "Warmest",
  recent: "Recently added",
} as const;
type Sort = keyof typeof SORTS;

const PLURAL: Record<ItemType, string> = {
  top: "Tops",
  bottom: "Bottoms",
  dress: "Dresses",
  outerwear: "Outerwear",
  shoes: "Shoes",
  accessory: "Accessories",
};

export default function WardrobePage() {
  const catalogue = useCatalogue();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<ItemType | "all">("all");
  const [formality, setFormality] = useState(0);
  const [warmth, setWarmth] = useState(0);
  const [source, setSource] = useState<"all" | "shipped" | "here">("all");
  const [sort, setSort] = useState<Sort>("type");
  const [editing, setEditing] = useState<CatalogueItem | null>(null);
  const photos = usePhotos();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoFor, setPhotoFor] = useState<string | null>(null);
  const [photoMsg, setPhotoMsg] = useState<string | null>(null);

  // Attach a photo to an existing item: re-encoded in the browser and kept on this device only. No AI call.
  async function attachPhoto(file: File) {
    if (!photoFor) return;
    setPhotoMsg(null);
    try {
      const img = await prepareImage(file);
      if (!(await savePhoto(photoFor, img.previewUrl))) throw new Error("This browser can’t keep photos.");
    } catch (err) {
      setPhotoMsg((err as Error).message);
    }
    setPhotoFor(null);
  }

  // Client-only flags (localStorage) after mount, so server and client markup match.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const changes = mounted ? localChangeCount() : 0;

  const counts = useMemo(() => {
    const c = Object.fromEntries(ITEM_TYPES.map((t) => [t, 0])) as Record<ItemType, number>;
    catalogue.forEach((i) => c[i.type]++);
    return c;
  }, [catalogue]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const f = LEVELS.formality[formality];
    const w = LEVELS.warmth[warmth];
    const list = catalogue
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => type === "all" || item.type === type)
      .filter(({ item }) => item.formality >= f.min && item.formality <= f.max)
      .filter(({ item }) => item.warmth >= w.min && item.warmth <= w.max)
      .filter(({ item }) => source === "all" || (source === "here") === (mounted && isAddedHere(item.item_id)))
      .filter(({ item }) => !q || `${item.item_id} ${item.type} ${item.colour} ${item.notes}`.toLowerCase().includes(q));
    const by: Record<Sort, (a: (typeof list)[0], b: (typeof list)[0]) => number> = {
      type: (a, b) => ITEM_TYPES.indexOf(a.item.type) - ITEM_TYPES.indexOf(b.item.type) || a.item.item_id.localeCompare(b.item.item_id),
      formal: (a, b) => b.item.formality - a.item.formality || a.item.item_id.localeCompare(b.item.item_id),
      warm: (a, b) => b.item.warmth - a.item.warmth || a.item.item_id.localeCompare(b.item.item_id),
      recent: (a, b) => b.index - a.index,
    };
    return list.sort(by[sort]).map((x) => x.item);
  }, [catalogue, query, type, formality, warmth, source, sort, mounted]);

  const filtered = query || type !== "all" || formality || warmth || source !== "all";
  const clear = () => {
    setQuery("");
    setType("all");
    setFormality(0);
    setWarmth(0);
    setSource("all");
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <div>
          <h1 className="font-serif text-display font-normal tracking-tight">Your wardrobe</h1>
          <p className="mt-3 text-graphite">
            {catalogue.length} items. Search, filter, correct tags and add photos. Photos stay on this device.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <Link href="/add" className="btn-quiet">
            Add items
          </Link>
          <button type="button" className="btn-quiet" onClick={exportCatalogueJson}>
            Export catalogue (JSON)
          </button>
          {changes > 0 && (
            <button
              type="button"
              className="btn-quiet"
              onClick={() =>
                window.confirm(
                  `Undo your ${changes} change${changes === 1 ? "" : "s"} (added, edited or removed items) and remove kept photos, going back to the original catalogue? Export first if you want to keep your items.`,
                ) && resetCatalogue()
              }
            >
              Reset to my catalogue
            </button>
          )}
        </div>
      </header>

      {/* ── Controls ── */}
      <section aria-label="Search and filters" className="space-y-5 border-y border-ink py-5">
        <div className="grid grid-cols-2 gap-5 md:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto] md:items-end">
          <div className="col-span-2 md:col-span-1">
            <label htmlFor="search" className="care block text-graphite">
              Search
            </label>
            <input
              id="search"
              type="search"
              className="field"
              placeholder="colour, item, ID…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {(
            [
              ["formality", formality, setFormality, LEVELS.formality],
              ["warmth", warmth, setWarmth, LEVELS.warmth],
            ] as const
          ).map(([name, v, set, opts]) => (
            <div key={name}>
              <label htmlFor={`f-${name}`} className="care block text-graphite">
                {name}
              </label>
              <select id={`f-${name}`} className="field" value={v} onChange={(e) => set(Number(e.target.value))}>
                {opts.map((o, i) => (
                  <option key={o.label} value={i}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <div>
            <label htmlFor="f-source" className="care block text-graphite">
              Source
            </label>
            <select
              id="f-source"
              className="field"
              value={source}
              onChange={(e) => setSource(e.target.value as typeof source)}
            >
              <option value="all">All items</option>
              <option value="shipped">Shipped catalogue</option>
              <option value="here">Added in this browser</option>
            </select>
          </div>
          <div>
            <label htmlFor="sort" className="care block text-graphite">
              Sort
            </label>
            <select id="sort" className="field" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              {Object.entries(SORTS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div role="group" aria-label="Type" className="flex flex-wrap gap-2">
          {(["all", ...ITEM_TYPES] as const).map((t) => {
            const on = type === t;
            return (
              <button
                key={t}
                type="button"
                aria-pressed={on}
                onClick={() => setType(t)}
                className={`border px-3 py-1 text-sm transition-colors ${
                  on ? "border-ink bg-ink text-paper" : "border-hairline hover:border-ink"
                }`}
              >
                {t === "all" ? "All" : PLURAL[t]}{" "}
                <span className={`font-mono text-xs ${on ? "" : "text-graphite"}`}>
                  {t === "all" ? catalogue.length : counts[t]}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Results ── */}
      <section aria-labelledby="results-h" aria-live="polite">
        <div className="mb-5 flex items-baseline justify-between gap-4">
          <h2 id="results-h" className="care text-graphite">
            Showing {shown.length} of {catalogue.length}
          </h2>
          {photoMsg && <p role="alert" className="text-sm">{photoMsg}</p>}
          {filtered && (
            <button type="button" className="btn-quiet text-sm" onClick={clear}>
              Clear filters
            </button>
          )}
        </div>

        {shown.length === 0 ? (
          <p className="font-serif text-xl text-graphite italic">Nothing matches those filters.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
            {shown.map((item) => {
              const here = mounted && isAddedHere(item.item_id);
              const edited = mounted && isEditedHere(item.item_id);
              return (
                <li key={item.item_id}>
                  <GarmentCard
                    item={item}
                    photoUrl={photos.get(item.item_id)}
                    note={
                      <div className="mt-2 border-t border-hairline pt-2">
                        <p className="care text-graphite">
                          Formality {item.formality} · Warmth {item.warmth}
                        </p>
                        {(here || edited) && (
                          <p className="care mb-1 text-graphite">{here ? "Added in this browser" : "Edited in this browser"}</p>
                        )}
                        <div className="flex gap-4 text-sm">
                          <button
                            type="button"
                            className="btn-quiet"
                            onClick={() => setEditing(item)}
                            aria-label={`Edit ${item.item_id}`}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn-quiet"
                            aria-label={`Remove ${item.item_id}`}
                            onClick={() =>
                              window.confirm(`Remove ${item.item_id} (${item.colour} ${item.notes}) from your wardrobe?`) &&
                              removeItem(item.item_id)
                            }
                          >
                            Remove
                          </button>
                        </div>
                        <div className="mt-1 flex gap-4 text-sm">
                          <button
                            type="button"
                            className="btn-quiet text-graphite"
                            aria-label={`${photos.has(item.item_id) ? "Replace" : "Add"} photo for ${item.item_id}`}
                            onClick={() => {
                              setPhotoFor(item.item_id);
                              fileRef.current?.click();
                            }}
                          >
                            {photos.has(item.item_id) ? "Replace photo" : "Add photo"}
                          </button>
                          {photos.has(item.item_id) && (
                            <button
                              type="button"
                              className="btn-quiet text-graphite"
                              aria-label={`Remove photo for ${item.item_id}`}
                              onClick={() => deletePhoto(item.item_id)}
                            >
                              Remove photo
                            </button>
                          )}
                        </div>
                      </div>
                    }
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) attachPhoto(f);
          e.target.value = "";
        }}
      />
      <ItemEditDialog item={editing} onClose={() => setEditing(null)} />
    </div>
  );
}
