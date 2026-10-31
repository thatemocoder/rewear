"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "./Icon";

/**
 * Fitting-room curtain page transition. `go(href)` draws the curtain closed, navigates,
 * and the curtain opens again once the new page has rendered. Skipped for reduced motion.
 */
type Phase = "open" | "closing" | "closed" | "opening";
const CurtainContext = createContext<{ go: (href: string) => void }>({ go: () => {} });
export const useCurtain = () => useContext(CurtainContext);

const CLOSE_MS = 620;

export function CurtainProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("open");
  const target = useRef<string | null>(null);

  const go = useCallback(
    (href: string) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return router.push(href);
      router.prefetch(href);
      target.current = href;
      setPhase("closing");
      window.setTimeout(() => {
        setPhase("closed");
        router.push(href);
      }, CLOSE_MS);
    },
    [router],
  );

  // Once the destination has rendered, open the curtain.
  useEffect(() => {
    if (phase !== "closed" || pathname !== target.current) return;
    window.scrollTo(0, 0);
    const t = window.setTimeout(() => setPhase("opening"), 280);
    return () => window.clearTimeout(t);
  }, [pathname, phase]);

  useEffect(() => {
    if (phase !== "opening") return;
    const t = window.setTimeout(() => setPhase("open"), 700);
    return () => window.clearTimeout(t);
  }, [phase]);

  return (
    <CurtainContext.Provider value={{ go }}>
      {children}
      {phase !== "open" && (
        <div className="curtain fixed inset-0 z-50" data-phase={phase} aria-hidden>
          {/* rail with rings */}
          <div className="absolute inset-x-0 top-0 z-10 h-3 bg-ink">
            <div className="mx-auto flex h-full max-w-[96vw] justify-between px-2">
              {Array.from({ length: 24 }, (_, i) => (
                <span key={i} className="mt-1.5 size-2.5 rounded-full border-2 border-[#8a7e6c]" />
              ))}
            </div>
          </div>
          <div className="curtain-panel curtain-left" />
          <div className="curtain-panel curtain-right" />
          <div
            className={`absolute inset-0 grid place-items-center text-paper transition-opacity duration-300 ${
              phase === "closed" ? "opacity-100" : "opacity-0"
            }`}
          >
            <span className="flex flex-col items-center gap-3">
              <Icon name="hanger" className="size-10" />
              <span className="font-serif text-xl italic">Into the fitting room…</span>
            </span>
          </div>
        </div>
      )}
    </CurtainContext.Provider>
  );
}
