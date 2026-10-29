"use client";

import { useId, useState } from "react";

/** File picker + drop zone. The input stays keyboard-focusable. */
export function PhotoDrop({
  onFiles,
  multiple = false,
  disabled,
  previewUrl,
  prompt = "Drop a photo of one garment",
  hint = "or choose a file",
  compact = false,
}: {
  onFiles: (files: File[]) => void;
  multiple?: boolean;
  disabled?: boolean;
  previewUrl?: string | null;
  prompt?: string;
  hint?: string;
  compact?: boolean;
}) {
  const id = useId();
  const [over, setOver] = useState(false);

  return (
    <label
      htmlFor={id}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const list = [...e.dataTransfer.files];
        if (list.length && !disabled) onFiles(multiple ? list : list.slice(0, 1));
      }}
      className={`relative grid cursor-pointer place-items-center overflow-hidden border bg-card text-center transition-colors focus-within:outline-2 focus-within:outline-offset-3 focus-within:outline-ink ${
        over ? "border-ink" : "border-hairline hover:border-graphite"
      } ${compact ? "min-h-28 p-4" : "aspect-[5/4] p-6 md:aspect-[4/5]"} ${disabled ? "cursor-wait" : ""}`}
    >
      <input
        id={id}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          const list = [...(e.target.files ?? [])];
          if (list.length) onFiles(list);
          e.target.value = ""; // allow re-selecting the same file
        }}
      />
      {previewUrl ? (
        // In-memory data URL; kept on the device only if the person chooses to on Save.
        <img src={previewUrl} alt="Your photo" className="absolute inset-0 size-full object-contain p-3" />
      ) : (
        <span>
          <span className={`block font-serif italic ${compact ? "text-lg" : "text-2xl"}`}>{prompt}</span>
          <span className="care mt-2 block text-graphite">{hint}</span>
        </span>
      )}
      {previewUrl && !disabled && (
        <span className="care absolute bottom-2 left-1/2 -translate-x-1/2 bg-paper px-2 py-1">Choose another</span>
      )}
    </label>
  );
}
