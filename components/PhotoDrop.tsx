"use client";

import { useId, useState } from "react";

/** File picker + drop zone for one photo. The input stays keyboard-focusable. */
export function PhotoDrop({
  onFile,
  disabled,
  previewUrl,
  prompt = "Drop a photo of one garment",
  compact = false,
}: {
  onFile: (file: File) => void;
  disabled?: boolean;
  previewUrl?: string | null;
  prompt?: string;
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
        const file = e.dataTransfer.files[0];
        if (file && !disabled) onFile(file);
      }}
      className={`relative grid cursor-pointer place-items-center overflow-hidden border bg-card text-center transition-colors focus-within:outline-2 focus-within:outline-offset-3 focus-within:outline-ink ${
        over ? "border-ink" : "border-hairline hover:border-graphite"
      } ${compact ? "min-h-28 p-4" : "aspect-[4/5] p-6"} ${disabled ? "cursor-wait" : ""}`}
    >
      <input
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/*"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = ""; // allow re-selecting the same file
        }}
      />
      {previewUrl ? (
        // In-memory data URL only: never stored.
        <img src={previewUrl} alt="Your photo" className="absolute inset-0 size-full object-contain p-3" />
      ) : (
        <span>
          <span className={`block font-serif italic ${compact ? "text-lg" : "text-2xl"}`}>{prompt}</span>
          <span className="care mt-2 block text-graphite">or choose a file</span>
        </span>
      )}
      {previewUrl && !disabled && (
        <span className="care absolute bottom-2 left-1/2 -translate-x-1/2 bg-paper px-2 py-1">Choose another</span>
      )}
    </label>
  );
}
