import type { ReactNode } from "react";

/** Oxblood care-label marker. Oxblood is reserved for AI-produced content. */
export function AiLabel({ children = "AI suggestion" }: { children?: ReactNode }) {
  return (
    <span className="care inline-flex items-center gap-2 font-medium text-oxblood">
      <span className="size-2 bg-oxblood" aria-hidden />
      {children}
    </span>
  );
}

/** Hand-off note: what the human should check themselves. */
export function YourCall({ children }: { children: ReactNode }) {
  return (
    <aside className="rise border-l-2 border-oxblood bg-oxblood-wash px-4 py-3" aria-label="Your call">
      <p className="care font-medium text-oxblood">Your call</p>
      <p className="mt-1">{children}</p>
    </aside>
  );
}
