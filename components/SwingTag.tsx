import type { ReactNode } from "react";
import type { CatalogueItem, ItemRef } from "@/lib/schemas";

export type TagVariant = "default" | "picked" | "draft" | "unknown";

/** 1–5 scale as a segmented bar: easier to read at small sizes than dots. */
export function Dots({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-graphite">{label}</span>
      <span className="flex gap-[2px]" role="img" aria-label={`${label} ${value} of 5`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={`h-[5px] w-[9px] rounded-[1px] ${n <= value ? "bg-ink" : "bg-hairline"}`} />
        ))}
      </span>
    </div>
  );
}

const sentence = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/**
 * The signature garment swing tag. Renders a catalogue item, or, when the AI
 * referenced an ID that isn't in the catalogue, the AI's own description in the
 * hatched "unknown" style so the mismatch stays visible.
 */
export function SwingTag({
  item,
  fallback,
  variant = item ? "default" : "unknown",
  tilt = 0,
  note,
  className = "",
}: {
  item?: CatalogueItem;
  fallback?: ItemRef;
  variant?: TagVariant;
  tilt?: number;
  note?: ReactNode;
  className?: string;
}) {
  const id = item?.item_id ?? fallback?.item_id ?? "—";
  return (
    <div className={`swing h-full ${className}`} data-variant={variant} style={tilt ? { rotate: `${tilt}deg` } : undefined}>
      <div className="swing-body flex flex-col px-3 pt-7 pb-3">
        <span className="swing-hole" aria-hidden />
        <span className="font-mono text-[13px] font-medium tracking-wide">{id}</span>
        {item ? (
          <>
            <span className="mt-1 text-sm leading-snug font-medium">{sentence(item.notes) || "Untitled item"}</span>
            <span className="text-sm leading-snug text-graphite">{item.colour}</span>
            <div className="mt-3 space-y-1 border-t border-hairline pt-2">
              <Dots label="Formality" value={item.formality} />
              <Dots label="Warmth" value={item.warmth} />
            </div>
          </>
        ) : (
          <>
            <span className="mt-1 text-sm leading-snug">{sentence(fallback?.description ?? "") || "No description"}</span>
            <span className="care mt-3 border-t border-graphite pt-2 text-graphite">Not in your wardrobe</span>
          </>
        )}
        {note}
      </div>
    </div>
  );
}
