"use client";

import { useId } from "react";
import { ITEM_TYPES, type ItemTags } from "@/lib/schemas";

const SCALE_ENDS = {
  formality: ["gym / lounge", "formal event"],
  warmth: ["very light", "very warm"],
} as const;

function DotScale({
  name,
  label,
  value,
  edited,
  onChange,
}: {
  name: "formality" | "warmth";
  label: string;
  value: number;
  edited: boolean;
  onChange: (n: number) => void;
}) {
  const uid = useId();
  return (
    <fieldset>
      <legend className="care flex gap-2 text-graphite">
        {label}
        {edited && <span className="text-ink">· edited</span>}
      </legend>
      <div className="mt-1.5 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="group relative grid size-7 cursor-pointer place-items-center">
            <input
              type="radio"
              name={`${uid}-${name}`}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="peer sr-only"
            />
            <span
              aria-hidden
              className={`size-3 rounded-full border border-ink transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink ${
                n <= value ? "bg-ink" : "bg-transparent group-hover:bg-hairline"
              }`}
            />
            <span className="sr-only">
              {n} of 5{n === 1 ? ` (${SCALE_ENDS[name][0]})` : n === 5 ? ` (${SCALE_ENDS[name][1]})` : ""}
            </span>
          </label>
        ))}
      </div>
      <p className="mt-0.5 flex justify-between text-xs text-graphite">
        <span>{SCALE_ENDS[name][0]}</span>
        <span>{SCALE_ENDS[name][1]}</span>
      </p>
    </fieldset>
  );
}

/**
 * The AI's draft tags as an editable swing tag. Fields the person has changed
 * from the AI draft are marked "edited", so human corrections stay visible.
 */
export function TagEditor({
  itemId,
  draft,
  value,
  onChange,
}: {
  itemId: string;
  draft: ItemTags; // the AI's original suggestion
  value: ItemTags;
  onChange: (next: ItemTags) => void;
}) {
  const uid = useId();
  const set = <K extends keyof ItemTags>(k: K, v: ItemTags[K]) => onChange({ ...value, [k]: v });
  const edited = (k: keyof ItemTags) => value[k] !== draft[k];
  // A render helper, not a component, so React doesn't see a new element type each render.
  const label = (k: keyof ItemTags, htmlFor: string, text: string) => (
    <label htmlFor={htmlFor} className="care flex gap-2 text-graphite">
      {text}
      {edited(k) && <span className="text-ink">· edited</span>}
    </label>
  );

  return (
    <div className="swing" data-variant="draft">
      <div className="swing-body px-5 pt-9 pb-4 sm:px-6">
        <span className="swing-hole" aria-hidden />
        <div className="flex items-baseline justify-between gap-4">
          <span className="care text-graphite">Item ID</span>
          <span className="font-mono text-base font-medium tracking-wide">{itemId}</span>
        </div>
        <p className="text-right text-xs text-graphite">Assigned on save</p>

        <div className="mt-5 grid gap-5">
          <div>
            {label("type", `${uid}-type`, "Type")}
            <select
              id={`${uid}-type`}
              className="field"
              value={value.type}
              onChange={(e) => set("type", e.target.value as ItemTags["type"])}
            >
              {ITEM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t[0].toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            {label("colour", `${uid}-colour`, "Colour")}
            <input
              id={`${uid}-colour`}
              className="field"
              required
              maxLength={60}
              value={value.colour}
              onChange={(e) => set("colour", e.target.value)}
            />
          </div>
          <div>
            {label("notes", `${uid}-notes`, "Notes")}
            <input
              id={`${uid}-notes`}
              className="field"
              required
              maxLength={120}
              value={value.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
          <DotScale
            name="formality"
            label="Formality"
            value={value.formality}
            edited={edited("formality")}
            onChange={(n) => set("formality", n)}
          />
          <DotScale
            name="warmth"
            label="Warmth"
            value={value.warmth}
            edited={edited("warmth")}
            onChange={(n) => set("warmth", n)}
          />
        </div>

        <p className="care mt-6 border-t border-oxblood pt-2 font-medium text-oxblood">AI tags — check before saving</p>
      </div>
    </div>
  );
}
