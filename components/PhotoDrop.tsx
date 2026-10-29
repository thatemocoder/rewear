"use client";

import { useId, useState } from "react";
import { Icon } from "./Icon";

/** File picker + drop zone. The input stays keyboard-focusable. */
export function PhotoDrop({
  onFiles,
  multiple = false,
  disabled,
  previewUrl,
  prompt = "Drop a photo",
  hint = "or browse",
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
      data-over={over}
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
      className={`dropzone group relative grid cursor-pointer place-items-center overflow-hidden text-center focus-within:outline-2 focus-within:outline-offset-3 focus-within:outline-ink ${
        compact ? "min-h-24 p-4" : "aspect-[5/4] p-6 md:aspect-[4/5]"
      } ${disabled ? "cursor-wait" : ""}`}
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
        <span className={`flex items-center gap-3 ${compact ? "flex-row" : "flex-col"}`}>
          <span
            className={`grid place-items-center rounded-full border border-hairline bg-paper transition-transform duration-200 group-hover:-translate-y-0.5 ${
              compact ? "size-10" : "size-16"
            }`}
          >
            <Icon name={compact ? "camera" : "upload"} className={compact ? "size-5" : "size-7"} />
          </span>
          <span className={compact ? "text-left" : ""}>
            <span className="block font-medium">{prompt}</span>
            <span className="block text-sm text-graphite">{hint}</span>
          </span>
        </span>
      )}
      {previewUrl && !disabled && (
        <span className="badge absolute bottom-2 left-1/2 -translate-x-1/2 bg-paper">Choose another</span>
      )}
    </label>
  );
}
