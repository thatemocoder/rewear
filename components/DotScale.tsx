"use client";

import { useId } from "react";

const SCALE_ENDS = {
  formality: ["gym / lounge", "formal event"],
  warmth: ["very light", "very warm"],
} as const;

/** Keyboard-accessible 1–5 scale drawn as dots (radio inputs underneath). */
export function DotScale({
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
      <legend className="label flex items-center gap-2">
        {label}
        {edited && <span className="badge">edited</span>}
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
