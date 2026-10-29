"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AboutDialog } from "./AboutDialog";
import { Icon } from "./Icon";

const NAV = [
  { href: "/", label: "Plan an outfit" },
  { href: "/wardrobe", label: "Wardrobe" },
  { href: "/add", label: "Add items" },
  { href: "/buy", label: "Before you buy" },
  { href: "/style", label: "In style" },
];

/** Two-tier masthead: wordmark + subtitle + About, then the page nav on its own row. */
export function SiteHeader() {
  const path = usePathname();
  return (
    <header className="border-b border-ink">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <div className="flex items-center justify-between gap-6 pt-6 pb-4">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/" className="group inline-flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-full border border-ink transition-transform duration-200 group-hover:-rotate-6">
                <Icon name="hanger" className="size-5" />
              </span>
              <span className="font-serif text-[1.85rem] leading-none font-medium tracking-tight">Rewear</span>
            </Link>
            <p className="text-sm text-graphite">AI-assisted outfit planner — suggestions only. You make the final call.</p>
          </div>
          <AboutDialog />
        </div>
        <nav aria-label="Main" className="-mx-3 flex gap-x-1 overflow-x-auto border-t border-hairline py-1.5 text-base">
          {NAV.map((n) => {
            const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 rounded-md px-3 py-2 whitespace-nowrap underline-offset-[10px] ${
                  active
                    ? "font-semibold text-ink underline decoration-2"
                    : "text-graphite decoration-transparent hover:bg-panel hover:text-ink"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
