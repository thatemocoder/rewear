"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { updateItem, type ItemEdit } from "@/lib/catalogue";
import type { CatalogueItem } from "@/lib/schemas";
import { DotScale } from "./DotScale";

/** Edit an existing item's tags. Type (and so the ID prefix) is fixed once an item exists. */
export function ItemEditDialog({ item, onClose }: { item: CatalogueItem | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const uid = useId();
  const [value, setValue] = useState<Required<ItemEdit> | null>(null);

  useEffect(() => {
    if (!item) return;
    setValue({ colour: item.colour, notes: item.notes, formality: item.formality, warmth: item.warmth });
    ref.current?.showModal();
  }, [item]);

  function close() {
    ref.current?.close();
  }

  function save(e: FormEvent) {
    e.preventDefault();
    if (!item || !value) return;
    updateItem(item.item_id, { ...value, colour: value.colour.trim(), notes: value.notes.trim() });
    close();
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && close()}
      aria-labelledby={`${uid}-h`}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] border border-ink bg-paper p-0 text-ink backdrop:bg-ink/40"
    >
      {item && value && (
        <form onSubmit={save} className="space-y-5 p-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id={`${uid}-h`} className="font-serif text-2xl">
              Edit item
            </h2>
            <span className="font-mono">{item.item_id}</span>
          </div>
          <p className="care text-graphite">Type · {item.type}</p>
          <div>
            <label htmlFor={`${uid}-colour`} className="label">
              Colour
            </label>
            <input
              id={`${uid}-colour`}
              className="field"
              required
              maxLength={60}
              value={value.colour}
              onChange={(e) => setValue({ ...value, colour: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor={`${uid}-notes`} className="label">
              Notes
            </label>
            <input
              id={`${uid}-notes`}
              className="field"
              required
              maxLength={120}
              value={value.notes}
              onChange={(e) => setValue({ ...value, notes: e.target.value })}
            />
          </div>
          <DotScale
            name="formality"
            label="Formality"
            value={value.formality}
            edited={false}
            onChange={(n) => setValue({ ...value, formality: n })}
          />
          <DotScale
            name="warmth"
            label="Warmth"
            value={value.warmth}
            edited={false}
            onChange={(n) => setValue({ ...value, warmth: n })}
          />
          <div className="flex items-center gap-5 pt-2">
            <button type="submit" className="btn">
              Save changes
            </button>
            <button type="button" className="btn-quiet" onClick={close}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}
